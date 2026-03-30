# 09. 모듈 의존성 그래프

> 관련 문서: [01-compilation-pipeline.md](01-compilation-pipeline.md)

## 개요

genshin-ts의 모듈 간 의존성을 레이어별로 정리한다. 순환 의존성 위험 지점과 공개 API 경계도 함께 기술한다.

---

## 레이어 구조

```
┌─────────────────────────────────────────────────┐
│  CLI (src/cli/)                                  │  사용자 진입점
├─────────────────────────────────────────────────┤
│  Compiler Pipeline (src/compiler/)               │  파이프라인 오케스트레이션
├─────────────────────────────────────────────────┤
│  AST Transform (ts_to_gs_transform/)             │  Stage 1 변환
│  IR Builder (src/runtime/)                       │  Stage 2 런타임
│  GIA Transform (ir_to_gia_transform/)            │  Stage 3 변환
├─────────────────────────────────────────────────┤
│  Definitions (src/definitions/)                  │  게임 API 정의
├─────────────────────────────────────────────────┤
│  Injector (src/injector/)                        │  .gil 바이너리 처리
├─────────────────────────────────────────────────┤
│  Shared / I18n (src/shared/, src/i18n/)          │  공유 유틸리티
├─────────────────────────────────────────────────┤
│  Thirdparty (src/thirdparty/)                    │  외부 의존 코드
└─────────────────────────────────────────────────┘
```

---

## 주요 의존성 맵

### CLI (`src/cli/gsts.ts`)

```
src/cli/gsts.ts
  ├── src/compiler/config_loader.ts
  ├── src/compiler/ts_to_gs_pipeline.ts
  ├── src/compiler/gs_to_ir_json_transform/index.ts
  ├── src/compiler/ir_merge.ts
  ├── src/compiler/ir_to_gia_pipeline.ts
  ├── src/injector/index.ts
  ├── src/i18n/index.ts
  ├── src/cli/checks.ts
  ├── src/cli/data.ts
  ├── src/cli/gil_paths.ts
  ├── src/cli/gil_resources.ts
  ├── src/cli/state.ts
  ├── src/cli/ui.ts
  └── src/cli/windows_open.ts
```

### Compiler Pipeline

```
src/compiler/ts_to_gs_pipeline.ts
  ├── src/compiler/config_loader.ts
  ├── src/compiler/gsts_config.ts
  └── src/compiler/ts_to_gs_transform/index.ts
        ├── src/compiler/ts_to_gs_transform/stmt.ts
        │     ├── src/compiler/ts_to_gs_transform/expr.ts
        │     │     ├── src/compiler/ts_to_gs_transform/builtins.ts
        │     │     ├── src/compiler/ts_to_gs_transform/list_methods.ts
        │     │     ├── src/compiler/ts_to_gs_transform/lists.ts
        │     │     └── src/compiler/ts_to_gs_transform/ops.ts
        │     ├── src/compiler/ts_to_gs_transform/loops.ts
        │     └── src/compiler/ts_to_gs_transform/types.ts
        └── src/compiler/ts_to_gs_transform/matcher.ts

src/compiler/gs_to_ir_json_transform/index.ts
  └── (서브프로세스 spawn → runner.ts)

src/compiler/gs_to_ir_json_transform/runner.ts  [서브프로세스]
  └── src/runtime/  (전체 런타임 임포트)

src/compiler/ir_to_gia_pipeline.ts
  └── (서브프로세스 spawn → ir_to_gia_transform/runner.ts)

src/compiler/ir_to_gia_transform/runner.ts  [서브프로세스]
  └── src/compiler/ir_to_gia_transform/shared.ts
        └── src/compiler/ir_to_gia_transform/index.ts
              ├── src/injector/proto.ts
              ├── src/compiler/gia_vendor.ts
              │     └── src/thirdparty/.../
              ├── src/compiler/ir_to_gia_transform/layout.ts
              ├── src/compiler/ir_to_gia_transform/node_id.ts
              ├── src/compiler/ir_to_gia_transform/optimize_timer_dispatch.ts
              ├── src/compiler/ir_to_gia_transform/pins.ts
              └── src/compiler/ir_to_gia_transform/preprocess.ts
```

### Runtime (`src/runtime/`)

```
src/runtime/core.ts
  ├── src/runtime/ir_builder.ts
  │     └── src/runtime/value.ts
  ├── src/runtime/value.ts
  ├── src/runtime/variables.ts
  ├── src/runtime/execution_flow_types.ts
  ├── src/runtime/meta_call_types.ts
  ├── src/runtime/runtime_config.ts
  ├── src/runtime/server_globals.ts
  ├── src/definitions/events.ts
  ├── src/definitions/events-payload.ts
  ├── src/definitions/events-payload-mode.ts
  ├── src/definitions/nodes.ts
  ├── src/definitions/node_modes.ts
  ├── src/definitions/zh_aliases.ts
  └── src/definitions/server_on_overloads.d.ts
```

### Definitions (`src/definitions/`)

```
src/definitions/nodes.ts
  ├── src/runtime/value.ts
  ├── src/runtime/IR.d.ts
  ├── src/runtime/variables.ts
  └── src/definitions/enum.ts

src/definitions/entity_helpers.ts
  ├── src/runtime/value.ts
  ├── src/definitions/enum.ts
  └── src/definitions/nodes.ts

src/definitions/events.ts
  └── src/runtime/value.ts
```

### Injector (`src/injector/`)

```
src/injector/index.ts
  ├── src/injector/binary.ts
  ├── src/injector/folder.ts
  ├── src/injector/node_graph.ts
  ├── src/injector/proto.ts
  ├── src/injector/signal_nodes.ts
  ├── src/injector/types.ts
  └── src/i18n/index.ts
```

---

## 서브프로세스 경계 (중요)

두 곳에서 서브프로세스가 spawn된다. 이 경계가 모듈 의존성의 단절점이다:

| spawn 위치 | 서브프로세스 |
|------------|------------|
| `gs_to_ir_json_transform/index.ts` | `runner.ts` → `src/runtime/` 전체 |
| `ir_to_gia_pipeline.ts` | `ir_to_gia_transform/runner.ts` → `ir_to_gia_transform/` |

**의미:** 이 두 서브프로세스는 **부모 프로세스와 메모리를 공유하지 않는다.** 데이터 전달은 파일 시스템(JSON 파일)과 환경 변수를 통해서만 이루어진다.

---

## 공개 API 경계 (`src/index.ts`)

`package.json`의 `exports` 필드와 `src/index.ts`가 외부 공개 API를 정의한다.

**공개 API:**
```typescript
// 컴파일러
export { compileTsToGs, compileTsToGsFromConfig }
export { emitIrJsonForEntries, hasEntryMarker, resolveIrOutputPath }
export { resolveGiaOutputPath, writeGiaFromIrJsonFile, writeGiaFromIrJsonFiles }

// 인젝터
export { createInjector, injectGilBytes, injectGilFile }
export type { InjectGilFileOptions, InjectGilFileResult, InjectGilInput, InjectGilResult, Injector }

// 정의
export * from './definitions/prefabs.js'
```

**내부 전용 (`types/gsts/index.d.ts`):**

사용자 프로젝트에서 임포트하는 타입들 (`GstsConfig`, 런타임 API 등)은 `types/gsts/` 에서 제공된다. 이 파일들은 빌드 후 `postbuild.mjs`가 생성한다.

---

## 순환 의존성 위험 지점

### `src/definitions/nodes.ts` ↔ `src/runtime/core.ts`

- `nodes.ts`는 `src/runtime/core.ts`의 `MetaCallRegistry`를 import한다
- `core.ts`는 `nodes.ts`의 `ServerExecutionFlowFunctions`를 import한다

이는 상호 의존이지만, TypeScript 타입만 임포트하므로 런타임 순환은 발생하지 않는다. **타입이 아닌 값 임포트로 바꾸면 문제가 생길 수 있다.**

### `src/compiler/ts_to_gs_transform/stmt.ts` ↔ `expr.ts`

- `stmt.ts`가 `expr.ts`의 `transformExpression`을 import
- `expr.ts`가 `stmt.ts`의 `transformHandler`를 import (중첩 핸들러 처리용)

실제 순환 의존이다. 현재는 ESM 모듈 초기화 순서상 문제가 없지만, 이 두 파일의 초기화 코드에 부작용이 추가되면 문제가 생길 수 있다.

---

## `@ts-nocheck` 처리 파일

`src/compiler/gia_vendor.ts`에 `// @ts-nocheck thirdparty` 주석이 있다. thirdparty 코드의 타입이 genshin-ts의 타입과 완벽히 호환되지 않으므로 타입 검사를 비활성화했다.

---

## 빌드 출력 구조

```
dist/
  src/
    index.js, index.d.ts
    compiler/
    runtime/
    definitions/
    injector/
    cli/
    i18n/
    shared/
    thirdparty/
types/
  gsts/
    index.d.ts     ← 사용자 프로젝트가 임포트하는 타입
configs/
  ts-plugin/
  tsconfig/
bin/
  gsts.mjs
```

`types/gsts/index.d.ts`는 `postbuild.mjs`가 빌드 후에 자동 생성한다.
