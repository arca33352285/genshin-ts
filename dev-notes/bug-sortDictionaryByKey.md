# sortDictionaryByKey — str key dict 미지원

- **날짜**: 2026-03-25
- **출처**: genshin-ts-run/docs/bug-sortDictionaryByKey.md

---

## 증상

`f.sortDictionaryByKey(dict, SortBy.Ascending)`이 에디터에서 "커스텀 변수 설정" 노드로 잘못 표시됨.
dict는 `{ sword: 100n, shield: 200n }` (str key, int value).

## 원인

**엔진 제약**: `sortDictionaryByKey`는 int key dict만 지원.

pin 레코드 (ID 1928)의 reflectMap에 `K:Int` 특수화만 존재:

```
S<K:Int,V:Ety>, S<K:Int,V:Gid>, S<K:Int,V:Int>, S<K:Int,V:Bol>,
S<K:Int,V:Flt>, S<K:Int,V:Str>, S<K:Int,V:Fct>, S<K:Int,V:Vec>,
S<K:Int,V:Cfg>, S<K:Int,V:Pfb>
```

`Str` key 특수화 없음 → `sort_dictionary_by_key__str_int` lookup 실패 → generic ID 1928 fallback → 에디터가 올바르게 렌더링하지 못함.

비교: `sortDictionaryByValue`(ID 1938)는 `S<K:Str,V:Int>` = ID 2708이 존재하여 정상 동작.

## 영향

| dict key 타입 | sortDictionaryByKey | sortDictionaryByValue |
|--------------|--------------------|-----------------------|
| int | 정상 (특수화 존재) | 정상 |
| str | **비정상** (generic fallback) | 정상 |
| 기타 | **비정상** (generic fallback) | key에 따라 다름 |

## 대응 방안

1. **컴파일 타임 에러**: str key dict에서 `sortDictionaryByKey` 호출 시 에러/경고 출력
2. **문서화**: `sortDictionaryByKey`는 int key dict 전용임을 JSDoc에 명시
3. **우회**: str key dict 정렬이 필요하면 `sortDictionaryByValue` 사용 또는 int key dict로 재설계
