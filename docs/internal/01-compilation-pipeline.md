# 01. 컴파일 파이프라인 전체 흐름

> 관련 문서: [02-ast-transform.md](02-ast-transform.md), [03-runtime-ir-builder.md](03-runtime-ir-builder.md), [05-gia-generation.md](05-gia-generation.md)

## 개요

genshin-ts의 컴파일 파이프라인은 세 단계로 구성된다.

```
Stage 1: .ts  →  .gs.ts      (TypeScript AST 변환)
Stage 2: .gs.ts  →  .json    (런타임 실행 → IR 직렬화)
Stage 3: .json  →  .gia      (IR → GIA 프로토버프 변환)
```

각 단계는 독립된 Node.js 서브프로세스로 실행된다. 이는 각 `.gs.ts` 파일을 실제로 `import`하고 실행하는 Stage 2의 특성 때문이다: 사이드 이펙트 격리, 병렬 처리, 그리고 ESM 모듈 캐시 오염 방지를 위해 서브프로세스 분리가 필수적이다.

---

## Stage 1: TS → .gs.ts

**진입점:** `src/compiler/ts_to_gs_pipeline.ts` → `compileTsToGs()`

### 흐름 요약

1. `gsts.config.ts`의 `entries` 패턴을 `fast-glob`으로 확장해 입력 파일 목록 생성
2. `ts.createProgram()`으로 TypeScript 컴파일러 프로그램 생성 (타입 체커 획득 목적)
3. 각 입력 파일에 대해 `transformToGs(sf, { checker, config, timerCounterRef })` 호출
4. 결과를 `dist/` 아래에 `.gs.ts` 확장자로 출력 (원본 디렉터리 구조 유지)
5. 엔트리 마커(`// @gsts:entry`)가 있는 파일은 `entryOutFiles` 목록에 포함

### 주요 함수

| 함수 | 위치 | 역할 |
|------|------|------|
| `compileTsToGs()` | `ts_to_gs_pipeline.ts:232` | 전체 Stage 1 오케스트레이션 |
| `compileTsToGsFromConfig()` | `ts_to_gs_pipeline.ts:367` | config 경로를 받아 `compileTsToGs` 래핑 |
| `transformToGs()` | `ts_to_gs_transform/index.ts` | 단일 소스파일 AST 변환 |
| `hasServerEntryCall()` | `ts_to_gs_transform/index.ts` | 파일이 `g.server().on()` 진입점을 포함하는지 확인 |
| `rewriteRelativeModuleSpecifiers()` | `ts_to_gs_pipeline.ts:97` | import/export 경로를 `.gs.ts` 출력 경로에 맞게 재작성 |

### 타이머 카운터 전처리

Stage 1 시작 전, 전체 소스파일을 스캔해 각 파일의 `setTimeout`/`setInterval` 호출 수를 세고(`countTimersInSourceFile`), 파일별로 타이머 인덱스 오프셋을 계산해 `timerOffsets` 맵에 저장한다. 이 오프셋은 타이머 풀 이름 충돌을 방지하기 위해 파일 간에 연속된 인덱스를 할당하는 데 사용된다.

### 출력 경로 규칙

- 입력: `<compileRoot>/src/main.ts`
- 출력: `<outDir>/src/main.gs.ts`

파일명 변환: `.ts` → `.gs.ts`

### config 옵션 영향

| 옵션 | 위치 | 효과 |
|------|------|------|
| `compileRoot` | `GstsConfig` | 입력 소스 루트 |
| `entries` | `GstsConfig` | glob 패턴, 디렉터리는 `**/*.ts`로 자동 확장 |
| `outDir` | `GstsConfig` | 출력 루트 |
| `options.transform.loopMax` | `GstsTransformOptions` | 무한루프 최대 반복 횟수 (기본 999) |
| `options.transform.features` | `GstsFeatureFlags` | 각 문법 기능 활성화 플래그 |
| `options.optimize` | `GstsOptimizeOptions` | 최적화 옵션 (Stage 2/3에도 영향) |

---

## Stage 1과 2 사이: IR Merge 준비

**진입점:** `src/compiler/ir_merge.ts` → `mergeIrJsonFilesByGraphId()`

동일한 `graph.id`를 가진 여러 `.json` 파일이 있을 경우, Stage 2 이후, Stage 3 이전에 병합이 이루어진다.

- 병합된 파일은 `__gsts: { merged: true, graphId: ..., sources: [...] }` 메타를 포함한다.
- 노드 ID 충돌을 피하기 위해 각 소스의 노드 ID를 재번호화한다.
- 그래프 이름은 가장 명시적으로 지정된 소스의 이름을 우선 사용한다.

---

## Stage 2: .gs.ts → IR JSON

**진입점:** `src/compiler/gs_to_ir_json_transform/index.ts` → `emitIrJsonForEntries()`

### 흐름 요약

1. 각 엔트리 `.gs.ts` 파일에 대해 서브프로세스(`runner.js`)를 spawn
2. runner가 해당 파일을 `import`하고 실행
3. 실행 과정에서 `g.server().on(...)` 호출들이 내부 실행 플로우를 누적
4. 파일 실행 완료 후 `buildIRDocument()`가 실행 플로우를 IR JSON으로 직렬화
5. JSON 결과를 `.json` 파일로 저장 (`.gs.ts` → `.json`)

### 서브프로세스 실행

```typescript
// gs_to_ir_json_transform/index.ts:33
const child = spawn(process.execPath, args, { stdio: 'inherit', cwd, env })
```

- `tsx` CLI를 통해 TypeScript를 직접 실행 (`tsx/cli` resolve)
- 환경 변수를 통해 최적화 옵션 전달:
  - `GSTS_PRECOMPILE_EXPR=1|0`
  - `GSTS_REMOVE_UNUSED_NODES=1|0`
- 병렬 처리: `os.cpus().length - 1` 개의 슬롯으로 동시 실행 (설정 가능)

### 출력 경로 규칙

- 입력: `<outDir>/src/main.gs.ts`
- 출력: `<outDir>/src/main.json`

`resolveIrOutputPath()`: `.gs.ts` → `.json`

### 에러 처리

- 서브프로세스가 0이 아닌 종료 코드를 반환하면 `[error] gs_to_ir_json failed: <path>` 에러 throw
- 실행 오류(TS 타입 에러, 런타임 에러)는 서브프로세스의 stderr로 전달됨

---

## Stage 3: IR JSON → .gia

**진입점:** `src/compiler/ir_to_gia_pipeline.ts` → `writeGiaFromIrJsonFiles()`

### 흐름 요약

1. 각 `.json` 파일에 대해 서브프로세스(`ir_to_gia_transform/runner.js`)를 spawn
2. runner가 IR JSON을 파싱
3. `irToGia()` 함수가 IR → GIA 프로토버프 바이트로 변환
4. `.gia` 파일로 저장

### 서브프로세스 실행

```typescript
// ir_to_gia_pipeline.ts:43
const child = spawn(process.execPath, args, {
  cwd: opts?.cwd,
  stdio: ['ignore', 'pipe', 'pipe']
})
```

- stdout: JSON 배열 `GiaWriteResult[]` (성공 시)
- stderr: `[ok] <path> (id=<id>)` 형태의 진행 상황 메시지
- 병렬 처리: `maxParallel` (기본 `os.cpus().length - 1`)
- `runWithLimit()` 헬퍼로 최대 동시 실행 수 제한

### 출력 경로 규칙

- 입력: `<outDir>/src/main.json`
- 출력: `<outDir>/src/main.gia`

`resolveGiaOutputPath()`: `.json` → `.gia`

### 멀티-GIA 출력 (배열 IR)

IR JSON이 배열 형태(`IRDocument[]`)인 경우:
- 각 문서가 별도의 `.gia` 파일로 출력됨
- 예: `main.json` → `main_0.gia`, `main_1.gia`, ...
- `includeIndices` 옵션으로 특정 인덱스만 선택적으로 출력 가능

---

## 전체 파이프라인 오케스트레이션 (CLI)

**파일:** `src/cli/gsts.ts`

CLI의 기본 빌드 명령(`gsts` 또는 `gsts dev`)이 세 단계를 순서대로 실행한다:

```
compileTsToGs()
  → emitIrJsonForEntries()
    → mergeIrJsonFilesByGraphId() (필요 시)
      → writeGiaFromIrJsonFiles()
        → injectGilFile() (inject 설정이 있을 경우)
```

### dev 모드 증분 빌드

`chokidar`로 소스 파일 변경을 감시한다:
- 변경된 파일만 Stage 1 재실행 (`emitEntries`로 범위 한정)
- Stage 2/3은 변경된 파일의 엔트리만 재처리
- 맵 파일 변경 감지 시 자동 재주입 (`reinjectOnMapChange: true`)

### 에러 처리 전략

- 각 단계의 실패는 throw되어 UI 레이어에서 출력됨
- `ui.error()` / `ui.warn()`으로 사용자에게 표시
- `--noinject` 플래그로 주입 단계만 건너뛸 수 있음
