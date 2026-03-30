# 10. 개발 가이드 — 기능 추가 및 수정

> 관련 문서: 각 기능별 상세 문서는 해당 번호 참조

## 개요

이 문서는 genshin-ts를 수정/확장할 때 필요한 실용적인 단계별 가이드다. 각 작업의 실제 파일 경로와 코드 패턴을 중심으로 설명한다.

---

## 1. 새 게임 이벤트 추가

### 시나리오

게임 업데이트로 새 이벤트 `whenFooHappens`가 추가된 경우.

### 단계

**Step 1:** `resources/node_definitions.json`에 이벤트 정의 추가

```json
{
  "name": "whenFooHappens",
  "nameZh": "当Foo发生时",
  "outputs": [
    { "name": "eventSourceEntity", "type": "entity" },
    { "name": "fooValue", "type": "integer" }
  ]
}
```

**Step 2:** `npm run gen` 실행

자동으로 다음 파일들이 업데이트된다:
- `src/definitions/events.ts` → `ServerEventMetadata.whenFooHappens` 추가
- `src/definitions/events-payload.ts` → `ServerEventPayloads.whenFooHappens` 타입 추가
- `src/definitions/zh_aliases.ts` → 중국어 별칭 추가

**Step 3:** (필요 시) `src/definitions/events-payload-mode.ts` 확인

beyond 모드 전용 이벤트라면 해당 파일에서 분리 타입에 추가가 필요할 수 있다.

**Step 4:** 빌드 확인

```bash
npm run build
```

---

## 2. 새 노드 함수 추가

### 시나리오

새 게임 함수 `doFooAction(entity, value)`를 추가하는 경우.

### 단계

**Step 1:** `resources/node_definitions.json`에 함수 정의 추가

```json
{
  "name": "doFooAction",
  "nameZh": "执行Foo动作",
  "inputs": [
    { "name": "entity", "type": "entity" },
    { "name": "value", "type": "integer" }
  ],
  "outputs": []
}
```

**Step 2:** `npm run gen` → `src/definitions/nodes.ts` 업데이트 확인

`ServerExecutionFlowFunctions`에 메서드가 추가됐는지 확인.

**Step 3:** `NODE_ID` 룩업 확인

`src/thirdparty/.../node_data/node_id.js`에 `doFooAction`에 해당하는 게임 내부 ID가 있어야 한다. 없으면 추가해야 한다.

**Step 4:** 엔티티 첫 인자 함수인 경우 `entity_helpers.ts` 업데이트

`src/definitions/entity_helpers.ts`의 `ENTITY_HELPER_METHODS` 배열에 `'doFooAction'` 추가. 이렇게 하면 `entity.doFooAction(value)` 형태의 메서드 체이닝이 가능해진다.

---

## 3. 새 값 타입 추가

### 시나리오

새 값 타입 `myType`을 추가하는 경우.

### 변경이 필요한 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/runtime/value.ts` | 새 클래스 `myType extends value` 추가 |
| `src/runtime/IR.d.ts` | `ValueTypeMap`에 `myType` 추가 |
| `src/runtime/ir_builder.ts` | `buildConnValueType()`에 `instanceof myType` 분기 추가 |
| `src/compiler/ir_to_gia_transform/index.ts` | `valueTypeToNodeType()`에 타입 매핑 추가 |
| `src/compiler/ir_to_gia_transform/pins.ts` | `baseNodeType()` 또는 핀 타입 설정 로직에 추가 |
| `src/runtime/server_globals.ts` | 전역 값 생성자로 노출 |

### 예시 (간단한 스칼라 타입)

**`src/runtime/value.ts`:**
```typescript
export class myType extends value {
  private _v: number
  constructor(v: number) {
    super()
    this._v = v
  }
  getValue() { return this._v }
}
export type MyTypeValue = myType | MetaCallRecordRef
```

**`src/runtime/IR.d.ts`의 `AdvancedValueTypeMap`:**
```typescript
interface AdvancedValueTypeMap {
  // 기존 타입들...
  my_type: number
}
```

**`src/runtime/ir_builder.ts`의 `buildConnValueType()`:**
```typescript
if (arg instanceof myType) return { type: 'my_type' }
```

**`src/compiler/ir_to_gia_transform/index.ts`의 `baseNodeType()`:**
```typescript
case 'my_type': return { t: 'b', b: 'MyT' }  // 실제 게임 타입 코드 확인 필요
```

---

## 4. 새 컴파일 문법 기능 추가

### 시나리오

삼항 연산자 `cond ? a : b`를 지원하는 경우 (기존에는 `ternary` feature flag로 비활성화).

### 단계

**Step 1:** `src/compiler/gsts_config.ts`의 `GstsFeatureFlags`에 플래그 추가 (이미 있음)

새 문법이면:
```typescript
export type GstsFeatureFlags = {
  // ...
  myNewFeature: boolean  // 추가
}
```

**Step 2:** `src/compiler/ts_to_gs_transform/types.ts`의 `buildFeatureFlags()`에 기본값 추가

```typescript
export function buildFeatureFlags(cfg: GstsConfig): GstsFeatureFlags {
  return {
    // ...
    myNewFeature: false,  // 기본값: 안전하게 비활성화
    ...(cfg.options?.features ?? {})
  }
}
```

**Step 3:** `src/compiler/ts_to_gs_transform/expr.ts` 또는 `stmt.ts`에 변환 로직 추가

삼항 연산자 예시 (`expr.ts`):
```typescript
if (ts.isConditionalExpression(node)) {
  if (!env.features.ternary) {
    fail(node, 'ternary operator requires features.ternary: true')
  }
  const cond = transformExpression(env, context, node.condition)
  const whenTrue = transformExpression(env, context, node.whenTrue)
  const whenFalse = transformExpression(env, context, node.whenFalse)
  return makeFCall(env.fIdent!, 'select', [cond, whenTrue, whenFalse])
}
```

**Step 4:** 런타임에서 해당 노드 함수가 `nodes.ts`에 있는지 확인

`select` 함수가 `ServerExecutionFlowFunctions`에 정의돼 있어야 한다.

**Step 5:** ESLint 규칙 업데이트 (필요 시)

`src/eslint/` 에서 해당 문법의 사용 오류를 사전에 잡는 규칙이 있다면 업데이트.

---

## 5. 새 최적화 추가

### 시나리오

IR 단계에서 특정 패턴의 노드를 최적화하는 경우.

### IR 레벨 최적화 (Stage 2)

**파일 위치:** `src/runtime/` 또는 `src/compiler/gs_to_ir_json_transform/runner.ts`

**Step 1:** 최적화 함수 작성

```typescript
// src/runtime/ir_optimize_my_opt.ts
export function myOptimization(doc: IRDocument): IRDocument {
  // IR 노드를 분석하고 변환
  return { ...doc, nodes: transformedNodes }
}
```

**Step 2:** `src/runtime/ir_builder.ts`의 `buildIRDocument()` 에서 호출 (또는 runner.ts에서)

**Step 3:** `GstsOptimizeOptions`에 옵션 추가 (`gsts_config.ts`)

```typescript
export type GstsOptimizeOptions = {
  // ...
  myOpt?: boolean  // 기본: true
}
```

**Step 4:** 환경 변수로 runner에 전달

```typescript
// gs_to_ir_json_transform/index.ts
env.GSTS_MY_OPT = runtimeOptions.myOpt !== false ? '1' : '0'
```

### GIA 레벨 최적화 (Stage 3)

**파일 위치:** `src/compiler/ir_to_gia_transform/`

`optimize_timer_dispatch.ts`를 참고해 동일 패턴으로 작성한다. `index.ts`에서 `irToGia()` 내에서 호출한다.

---

## 6. 새 CLI 서브 명령 추가

**파일:** `src/cli/gsts.ts`

**Step 1:** `program.command()` 체인으로 명령 등록

```typescript
program
  .command('my-cmd')
  .description('My new command')
  .option('--flag', 'some flag')
  .action(async (opts) => {
    const lang = await detectLang()
    const { t } = initCliI18n(lang)
    // 구현
  })
```

**Step 2:** i18n 메시지 추가 (필요 시)

- `src/i18n/locales/ko-KR.json` (한국어)
- `src/i18n/locales/zh-CN.json`
- `src/i18n/locales/en-US.json`

---

## 7. 테스트 추가

**테스트 위치:** `tests/`

테스트 실행:
```bash
npm test
```

테스트는 실제 컴파일 → 주입 사이클을 수행하는 통합 테스트 방식이다. `scripts/generate-*-tests.ts`가 테스트 케이스를 자동 생성한다.

**새 노드 테스트 추가:**
```bash
tsx scripts/generate-node-gia-tests.ts
```

**주의:** `npm test`는 `npm run build`를 먼저 실행한다. 소스 변경 후 반드시 빌드가 필요하다.

---

## 8. 빌드 및 배포

**개발 빌드:**
```bash
npm run build
```

**패키징:**
```bash
npm run pack
```

**`postbuild.mjs`가 하는 일:**
- `types/gsts/index.d.ts` 생성
- 빌드 후 정리 작업

**릴리즈:**
```bash
tsx scripts/release.mjs
```

---

## 공통 주의 사항

### 서브프로세스 경계에서의 데이터 전달

Stage 2/3은 서브프로세스로 실행된다. 새 설정을 서브프로세스에 전달하려면:
- 환경 변수 사용 (`process.env.GSTS_*`)
- 또는 CLI 인자로 전달 (`spawn(node, [runnerPath, arg1, arg2, ...])`)

JSON 파일을 통한 전달도 가능하지만 오버헤드가 크다.

### `// @ts-nocheck` 파일 수정

`src/compiler/gia_vendor.ts`나 thirdparty 파일을 수정할 때는 타입 검사가 비활성화된 상태임을 인지하고, 런타임 동작을 직접 테스트해야 한다.

### 생성된 파일 직접 편집 금지

`src/definitions/events.ts`, `nodes.ts`, `zh_aliases.ts`는 자동 생성 파일이다. 직접 편집하면 `npm run gen` 시 덮어써진다. 반드시 소스 데이터(`resources/node_definitions.json`)를 수정하고 `npm run gen`을 실행한다.

### ESM 모듈 캐시

Stage 2 서브프로세스는 매 빌드마다 새 프로세스를 생성하므로 ESM 모듈 캐시 문제가 없다. 하지만 같은 프로세스에서 여러 번 `import`를 시도하는 코드를 작성하면 캐시 문제가 발생할 수 있다.

### Windows 경로

genshin-ts는 Windows를 주요 타겟으로 한다 (게임이 Windows 전용). 경로 처리 시:
- `path.posix.join()` 또는 `toPosixPath()` 헬퍼 사용
- `\` 대신 `/` 사용 (fast-glob 호환성)
- Windows 경로는 `path.resolve()`로 정규화 후 사용
