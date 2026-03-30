# 06. 인젝터 (src/injector/)

> 관련 문서: [05-gia-generation.md](05-gia-generation.md), [07-cli.md](07-cli.md)

## 개요

인젝터는 `.gia` 파일의 NodeGraph 바이트를 `.gil` 게임 맵 파일 내의 대상 NodeGraph와 교체한다. `.gil`은 프로토버프 기반의 바이너리 포맷이며, 인젝터는 직접 바이너리 파싱/패치를 수행한다.

**공개 API (`src/injector/index.ts`):**
- `createInjector(protoPath?)` → `Injector` 객체
- `injectGilFile(options)` → `InjectGilFileResult`
- `injectGilBytes(input)` → `InjectGilResult`

---

## `.gil` 바이너리 포맷

`.gil` 파일은 프로토버프 바이너리다. 고수준 구조:

```
Root message
  └── Folder (field 10)
        ├── FolderIndex (field 1) × N   ← 폴더 인덱스 목록
        └── NodeGraph blobs (field 10.1.1) × M  ← NodeGraph 원시 바이트
```

**중요:** genshin-ts는 `.gil` 전체를 프로토버프로 파싱하지 않는다. 대신, 직접 varint 파싱을 통해 타겟 NodeGraph의 위치(바이트 오프셋)만 찾아서 해당 범위만 교체한다. 이는 속도와 안정성을 위한 설계다.

---

## `binary.ts` — 저수준 바이너리 파싱

**`readVarint(buf, offset)`:** 프로토버프 varint 디코딩. 반환값: `{ value, next }`.

**`encodeVarint(value)`:** 숫자를 varint 바이트 배열로 인코딩.

**`parseMessage(buf, start, end, depth, p0...p5, out, collectors?)`:**
`.gil` 바이너리를 재귀적으로 순회하며, 각 len-delimited 필드의 위치(오프셋, 크기)를 `LenField` 배열에 수집한다.

`LenField` 타입:
```typescript
type LenField = {
  field: number      // 프로토버프 필드 번호
  depth: number      // 중첩 깊이
  p0..p5: number     // 상위 6단계 필드 번호 경로
  lenOffset: number  // length varint의 시작 오프셋
  lenSize: number    // length varint의 바이트 크기
  dataStart: number  // 데이터 시작 오프셋
  dataEnd: number    // 데이터 종료 오프셋
}
```

**`applyReplacement(buf, patches)`:** 바이트 배열에 `Patch` 목록을 적용해 새 배열을 반환한다.

**`buildFile(buf, patches)`:** `applyReplacement`의 별칭.

---

## `folder.ts` — 폴더/인덱스 구조 파싱

`.gil`의 폴더 메타데이터를 파싱한다.

**`collectFolderIndexes(buf)`:** 전체 `.gil`을 스캔해 모든 `FolderIndex` 항목을 반환한다.

`FolderIndex` 타입:
```typescript
type FolderIndex = {
  entryField: LenField        // 인덱스 항목 필드 위치
  folderId?: number           // 폴더 ID
  contentField?: LenField     // 폴더 콘텐츠 필드 위치
  contentEntries: FolderEntry[]  // 폴더 내 항목 목록
  metaLists: Array<...>
}
```

`FolderEntry` 타입:
```typescript
type FolderEntry = {
  typeValue?: number  // 그래프 타입 값 (800, 2300, 2400, 4300)
  id?: number         // NodeGraph ID
}
```

**그래프 타입 값 ↔ 타입 매핑:**

| typeValue | 그래프 타입 |
|-----------|------------|
| 800 | entity (20000) |
| 2300 | status (20003) |
| 2400 | class (20004) |
| 4300 | item (20005) |

**`findFolderEntryField(folderIndexes, targetId)`:** 대상 ID에 해당하는 `FolderIndex` 항목을 찾는다.

**`resolveGraphTypeForTypeValue(typeValue)`:** typeValue → 그래프 타입 번호 변환.

---

## `node_graph.ts` — NodeGraph 위치 및 교체

**`findNodeGraphTargets(buf, targetId?)`:**

`.gil` 바이너리에서 NodeGraph 필드를 찾는다. `depth=3, p0=10, p1=1, p2=1` 위치의 len-delimited 필드가 NodeGraph 원시 바이트다.

각 NodeGraph 필드를 `tryReadNodeGraphIdAndType()`으로 빠르게 파싱:
- 첫 varint 키가 10이 아니면 즉시 건너뜀 (ultra-fast 시그니처 체크)
- NodeGraph.Id.id (field 5) 와 NodeGraph.Id.type (field 2)를 추출

**`loadGiaGraph(giaBytes)`:** `.gia` 파일을 파싱해 NodeGraph 프로토버프 객체를 반환한다.

**`getGraphId(graph)` / `setGraphId(graph, id)`:** NodeGraph의 ID를 읽거나 설정한다.

**`extractGraphType(graph)` / `setGraphType(graph, type)`:** NodeGraph의 타입(entity/status/class/item)을 읽거나 설정한다.

**`buildGraphTypeMap(buf)`:** `.gil` 내 모든 NodeGraph의 `id → typeValue` 매핑을 구축한다.

---

## `index.ts` — 주입 로직 및 안전 검사

**`injectGilBytes(input: InjectGilInput): InjectGilResult`**

바이트 레벨 주입 핵심 함수. 흐름:

1. `.gia` 바이트에서 NodeGraph ID 추출
2. `targetId` 결정 (명시 > `.gia`에서 추론)
3. `findNodeGraphTargets(gilBytes, targetId)`로 교체 위치 파악
4. **안전 검사** (skipNonEmptyCheck가 false인 경우):
   - 대상 NodeGraph가 비어있거나 이름이 `_GSTS`로 시작해야 함
   - 그래프 타입이 `.gia`의 타입과 호환되어야 함
5. `.gia`의 NodeGraph ID를 targetId로 재설정 (불일치 시)
6. 필요하면 그래프 타입 패치
7. `applyReplacement()`로 `.gil` 바이너리의 NodeGraph 필드를 교체
8. 새 `.gil` 바이트 반환

**`injectGilFile(options: InjectGilFileOptions): InjectGilFileResult`**

파일 기반 래퍼:
1. `.gil` 파일 읽기
2. `injectGilBytes()` 호출
3. 결과를 `outPath`(기본: 입력 경로 덮어쓰기)에 저장
4. 결과 반환

---

## `proto.ts` — 프로토버프 스키마 로딩

`.gia` 파일을 파싱하고 직렬화하기 위한 프로토버프 스키마를 로드한다.

**`loadGiaProto(protoPath?)`:** `protobufjs`로 `.proto` 파일을 로드. 기본 경로는 `DEFAULT_GIA_PROTO` (thirdparty 패키지 내).

---

## `signal_nodes.ts` — 시그널 노드 ID 패치

**`patchSignalNodeIds(graph)`:** `onSignal` 이벤트 노드의 시그널 파라미터 ID를 올바르게 패치한다.

---

## CLI에서의 주입 흐름

`src/cli/gsts.ts`의 `maybeInjectGia()` 함수:

1. `resolveGilFolder()` — 게임 설치 경로에서 BeyondLocal 폴더 찾기
2. `resolveGilTarget()` — `mapId.gil` 파일 경로 결정
3. **백업 생성:** `<mapId>.gil.bak.<timestamp>` 형태로 백업 파일 저장
4. `injectGilFile()` 호출
5. 성공/실패 UI 출력

**백업 정책:** 마지막 백업 시각이 `lastBackupAtByMap`에 저장됨 (`src/cli/state.ts`). 너무 빈번한 백업 방지를 위한 최소 간격 체크가 있을 수 있음.

---

## 안전 검사 상세

**비어있지 않은 그래프 보호:**
- 대상 NodeGraph에 이미 노드가 있고 이름이 `_GSTS`로 시작하지 않으면 주입을 거부한다.
- `skipSafeCheck: true` 또는 `gsts.config.ts`의 `inject.skipSafeCheck`로 우회 가능.

**이름 검사:**
- 새로 생성한 NodeGraph의 이름은 반드시 `_GSTS`로 시작해야 한다 (기본값: `_GSTS_`).
- 에디터에서 빈 NodeGraph를 생성하고 저장한 후 주입해야 한다.

**그래프 타입 호환:**
- `.gia`의 그래프 타입(entity/status/class/item)이 `.gil` 내 대상 NodeGraph의 타입과 일치해야 한다.
- 불일치 시 경고 또는 에러.

---

## 주의 사항 (gotchas)

1. **`.gil` 파일은 맵 에디터에서 저장 후에만 NodeGraph 항목이 생성된다.** 에디터에서 NodeGraph를 만들고 저장하지 않으면 인젝터가 대상을 찾지 못한다.

2. **전체 프로토버프 파싱을 피한다.** `protobufjs`로 전체 `.gil`을 파싱하면 매우 느리다. 대신 varint 직접 파싱으로 NodeGraph 블롭의 바이트 범위만 찾아서 교체한다.

3. **NodeGraph 블롭 위치:** `depth=3, p0=10, p1=1, p2=1` 경로. 이 경로가 바뀌면 `isNodeGraphBlobField()` 체크가 실패한다.
