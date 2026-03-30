# 07. CLI 아키텍처 (src/cli/)

> 관련 문서: [01-compilation-pipeline.md](01-compilation-pipeline.md), [06-injector.md](06-injector.md)

## 개요

`src/cli/`는 `gsts` CLI 명령의 구현부다. `bin/gsts.mjs`가 진입점이며, `src/cli/gsts.ts`가 모든 서브 명령을 정의한다.

**의존 라이브러리:**
- `commander` — CLI 옵션/서브명령 파싱
- `chokidar` — 파일 시스템 감시 (dev 모드)
- `fast-glob` — 파일 패턴 매칭
- `picocolors` — 터미널 색상 출력

---

## `gsts.ts` — 메인 CLI 파일

### 전역 옵션

```
gsts [--config <path>] [--noinject] [--lang <lang>] <command>
```

| 옵션 | 설명 |
|------|------|
| `--config` | `gsts.config.ts` 경로 (기본: CWD의 `gsts.config.ts`) |
| `--noinject` | 주입 단계 건너뛰기 |
| `--lang` | CLI 출력 언어 강제 지정 |

### 서브 명령 목록

| 명령 | 역할 |
|------|------|
| `gsts` (기본) | 단일 파일 모드: `gsts <file>` 형태 |
| `gsts dev` | 증분 빌드 + 파일 감시 모드 |
| `gsts maps` | 최근 수정된 맵 파일 목록 출력 |
| `gsts [file]` | 단일 `.ts` 파일 컴파일 및 주입 |

### 배치 빌드 흐름 (`runBatch()`)

config의 모든 엔트리를 한 번에 빌드하는 함수:

```
compileTsToGs()                    Stage 1
  → emitIrJsonForEntries()         Stage 2 (병렬)
    → mergeIrJsonFilesByGraphId()  병합 (필요 시)
      → writeGiaFromIrJsonFiles()  Stage 3 (병렬)
        → injectMany()             주입
```

### dev 모드 증분 빌드

`chokidar`로 `compileRoot` 하위의 `.ts` 파일 변경을 감시한다.

**변경 감지 시 처리 흐름:**
1. 변경된 파일 목록을 `emitEntries`로 제한해 Stage 1 재실행
2. Stage 1 출력에서 `// @gsts:entry` 마커를 확인
3. 엔트리 파일만 Stage 2/3 재처리
4. 변경된 `.gs.ts` 중 엔트리가 없으면 Stage 2/3 건너뜀

**맵 파일 재주입 (`reinjectOnMapChange: true`):**
- `chokidar`로 `.gil` 파일 변경도 감시
- `.gil` 파일이 외부(에디터)에서 저장되면 이미 생성된 `.gia` 파일을 자동으로 재주입

**설정 캐싱 (`loadGstsConfigCached`):**
- `gsts.config.ts`를 `mtime` 기반으로 캐싱
- 파일이 변경된 경우에만 재로드

---

## `config_loader.ts` — 설정 로더

**`loadGstsConfig(cfgPath)`:** `gsts.config.ts`를 `tsx`로 동적 import해 `GstsConfig` 객체를 반환한다. `tsx`는 TypeScript 파일을 직접 실행할 수 있어 별도 컴파일 없이 config를 로드한다.

**`existsFile(p)` / `existsDir(p)`:** 경로 존재 여부 확인 헬퍼.

---

## `state.ts` — 증분 빌드 상태

```typescript
type CliState = {
  lastBackupAtByMap?: Record<string, number>  // 맵별 마지막 백업 시각 (unix ms)
  updateCheck?: { lastAt?: number; streak?: number }  // 업데이트 확인 상태
  noticeCheck?: { lastAt?: number; streak?: number }  // 공지 확인 상태
}
```

**저장 위치:** `getStatePath()`가 반환하는 플랫폼별 앱 데이터 경로 (예: `%APPDATA%/genshin-ts/`).

**`getMapKey(playerId, mapId)`:** `"<playerId>-<mapId>"` 형태의 고유 키 생성.

---

## `data.ts` — 앱 데이터 디렉터리

**`ensureDataDirs()`:** 앱 데이터 디렉터리 초기화.

**`getStatePath()`:** 상태 파일(`state.json`) 경로 반환.

---

## `gil_paths.ts` — GIL 파일 경로 해석

**`resolveGilFolder(cfg)`:** `GstsInjectConfig`에서 BeyondLocal 폴더를 찾는다:

```
%LocalAppData%/../LocalLow/miHoYo/
  ├── 原神/BeyondLocal/           (China)
  └── Genshin Impact/BeyondLocal/  (Global)
```

`gameRegion`이 지정되지 않으면 두 경로를 모두 검사해 존재하는 것을 사용. 둘 다 존재하면 에러.

**`resolveGilTarget(cfg, folder)`:** `<folder>/<playerId>/<mapId>.gil` 경로 반환. `playerId`가 없으면 폴더 내 유일한 숫자 디렉터리를 자동 탐지.

---

## `gil_resources.ts` — 커스텀 리소스 추출

**`extractCustomResourcesFromGil(gilPath, outPath?)`:**

`.gil` 파일에서 Custom Prefab ID를 추출해 TypeScript 파일로 저장한다.

**기본 출력 경로:** `src/resources/prefabs.ts` (`DEFAULT_RESOURCES_PATH` 상수).

`extractResources: true` (기본값)일 때 dev/빌드 시 자동 실행된다.

---

## `ui.ts` — UI 출력 포매터

**`createUi()`:** 콘솔 출력 유틸리티 객체 반환.

```typescript
const ui = createUi()
ui.info(msg)    // 일반 정보
ui.success(msg) // 성공 (초록색)
ui.warn(msg)    // 경고 (노란색)
ui.error(msg)   // 에러 (빨간색)
```

---

## `i18n/` — 국제화

**`src/i18n/`** 에 CLI 메시지 번역이 있다.

- `src/i18n/index.ts` → `detectLang()`, `initCliI18n()`, `t()` 함수 제공
- `src/i18n/locales/` → `zh-CN.json`, `en-US.json` 번역 파일
- `i18next` 라이브러리 기반

**언어 결정 순서:**
1. `GstsConfig.lang` 설정값
2. `--lang` CLI 플래그
3. `os-locale`로 시스템 언어 자동 감지 (auto)
4. fallback: `en-US`

---

## `checks.ts` — 원격 업데이트/공지 확인

**`maybeCheckRemoteMarkdown(type, lang)`:**

GitHub에서 업데이트 공지나 새 버전 정보를 주기적으로 확인한다. `state.ts`에 `lastAt`과 `streak`을 저장해 너무 자주 확인하지 않도록 한다.

---

## `windows_open.ts` — Windows 파일 탐색기 연동

**`openAndSelect(path)`:** 지정된 파일을 Windows 탐색기에서 선택해 열기.

**`openDir(dir)`:** 디렉터리를 탐색기에서 열기.

`gsts maps` 명령에서 맵 파일 경로를 탐색기로 여는 데 사용.

---

## `notice_frontmatter.ts` / `markdown_render.ts`

원격에서 가져온 공지 마크다운을 터미널에 렌더링하는 유틸리티.

---

## `pkg.ts`

`package.json`에서 버전 정보를 읽는 헬퍼. 업데이트 확인 시 현재 버전 비교에 사용.

---

## 에러 처리 전략

- 각 단계의 에러는 `ui.error()`로 출력하고 계속 진행하거나 종료
- `process.exit(1)`: 치명적 에러 (설정 파일 없음, 컴파일 실패 등)
- 주입 실패는 개별 `.gia`마다 독립적으로 처리 (`ok`, `fail` 카운터)
- dev 모드에서는 에러가 발생해도 프로세스가 종료되지 않고 다음 변경을 대기
