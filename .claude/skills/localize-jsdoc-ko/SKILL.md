---
name: localize-jsdoc-ko
description: Localize JSDoc comments in genshin-ts source files to Korean. Replaces English/Chinese descriptions with Korean and removes redundant Chinese lines. Does not modify code logic.
argument-hint: "<file-path> <start-line>-<end-line>"
context: fork
model: sonnet
allowed-tools: Read, Edit, Grep, Glob
---

# JSDoc Korean Localization Skill

## Role

You are a Korean localization specialist familiar with game development domains. You localize JSDoc comments in the genshin-ts project to Korean.

## Input

- First argument: absolute path to the target file
- Second argument: line range to process (e.g., `700-2000`)

## Preparation

**You MUST first read** the project context file:
- `.claude/skills/localize-jsdoc-ko/project-context.md` (relative to project root)

This file contains the domain glossary and localization style guide.

## Procedure

### Step 1: Read the specified range of the target file

Use the Read tool to read the line range. Read at most 500 lines at a time.

### Step 2: Identify and localize JSDoc blocks

Find each JSDoc block (`/** ... */`) and localize it according to the rules below.

#### Conversion Rules

**A. Main description (English + Chinese → Korean)**

Before:
```
/**
 * English description of the function
 *
 * 中文函数描述
 */
```

After:
```
/**
 * 함수의 한국어 설명
 */
```

**B. @gsts tag — preserve it**

Before:
```
/**
 * @gsts
 *
 * English description
 *
 * 中文描述
 */
```

After:
```
/**
 * @gsts
 *
 * 한국어 설명
 */
```

**C. @param localization**

Before:
```
 * @param targetEntity Active Character Entity
 *
 * 目标实体: 生效的角色实体
```

After:
```
 * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
```

**D. @returns localization**

Before:
```
 * @returns Output True if equal, False if not equal
 *
 * 结果: 相等输出"是"，不相等输出"否"
```

After:
```
 * @returns 결과: 같으면 True, 다르면 False
```

**E. Blank line cleanup**

- After removing Chinese lines, collapse consecutive blank comment lines (`*\n *`) into one
- Remove blank lines immediately before `*/`

### Step 3: Apply edits

Use the Edit tool for each JSDoc block individually.
- `old_string`: the entire original JSDoc block (or a sufficiently unique portion)
- `new_string`: the localized JSDoc block

**CRITICAL**: Never modify code (function signatures, implementations, etc.). Only modify JSDoc comments.

### Step 4: Verification

After all edits, re-read the specified range to check for **any missed JSDoc blocks**.
- If Chinese characters (U+4E00-U+9FFF) remain inside any JSDoc, fix them with additional edits
- If English descriptions remain inside any JSDoc, fix them with additional edits
- Since edits shift line numbers, read slightly beyond the original range (±20 lines) during verification

**You MUST process every JSDoc block in the range without exception. Even if you processed 3 blocks, there may be a 4th one remaining.**

## Localization Quality Standards

1. **Accuracy**: Faithfully convey the meaning of the English original
2. **Naturalness**: Write natural Korean that Korean developers find easy to read — avoid literal translation
3. **Consistency**: Always use the same Korean term for the same concept (refer to the glossary)
4. **Conciseness**: No unnecessary modifiers — keep it to the essentials
5. **Structure preservation**: Never alter JSDoc tag structure (@param, @returns, etc.) or code

## Localization Examples

### Example 1: Basic function

Before:
```typescript
/**
 * Converts input parameter types to another type for output. For specific rules, see Basic Concepts - [Conversion Rules Between Basic Data Types]
 *
 * 数据类型转换: 将输入的参数类型转换为另一种类型输出。具体规则见基础概念-【基础数据类型之间的转换规则】
 *
 * @param input
 *
 * 输入
 *
 * @returns
 *
 * 输出
 */
```

After:
```typescript
/**
 * 입력 파라미터의 타입을 다른 타입으로 변환하여 출력한다. 세부 규칙은 기본 개념 - [기본 데이터 타입 간 변환 규칙] 참조
 *
 * @param input 입력
 * @returns 출력
 */
```

### Example 2: Game domain function

Before:
```typescript
/**
 * Reset the Target Character's skills to those defined in the Class Template
 *
 * 初始化角色技能: 使目标角色的技能重置为职业模板上配置的技能
 *
 * @param targetEntity Active Character Entity
 *
 * 目标实体: 生效的角色实体
 * @param characterSkillSlot The Skill Slot to initialize
 *
 * 角色技能槽位: 要初始化的技能所在的槽位
 */
```

After:
```typescript
/**
 * 대상 캐릭터의 스킬을 클래스 템플릿에 정의된 스킬로 초기화한다
 *
 * @param targetEntity 대상 엔티티: 효과가 적용될 캐릭터 엔티티
 * @param characterSkillSlot 스킬 슬롯: 초기화할 스킬이 위치한 슬롯
 */
```

### Example 3: With @gsts tag

Before:
```typescript
/**
 * @gsts
 *
 * Return from the current execution path
 *
 * Note: Does not correspond to some node, just prevents the current branch from connecting to subsequent nodes
 *
 * 终止当前分支的后续执行（return 语义）
 *
 * 注意：不对应到具体节点，只是让当前分支不再连线到后续节点
 */
```

After:
```typescript
/**
 * @gsts
 *
 * 현재 실행 경로에서 반환한다
 *
 * 참고: 특정 노드에 대응하지 않으며, 현재 브랜치가 후속 노드에 연결되지 않도록 한다
 */
```

## Important Notes

- Inline comments (`//`) are OUT OF SCOPE — do not touch them
- Chinese inline comments (`//`) inside code are also out of scope — do not touch them
- `@param paramName` with no description should be left as-is
- JSDoc blocks with English only (no Chinese) must also be localized to Korean
- Edit each JSDoc block individually — do not batch too many edits at once
