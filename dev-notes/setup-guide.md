# genshin-ts 프로젝트 설정 가이드

## 사전 준비

- [Node.js](https://nodejs.org/) v20 이상 설치
- [Git](https://git-scm.com/) 설치

## 프로젝트 생성

```bash
# 1. genshin-ts 레포 클론
git clone -b personal https://github.com/arca33352285/genshin-ts.git

# 2. 프로젝트 생성 (my-project 부분을 원하는 이름으로 변경)
node genshin-ts/create-genshin-ts/bin/create-genshin-ts.mjs my-project

# 3. 프로젝트 폴더로 이동 후 설치
cd my-project
npm install

# 4. gsts.config.ts에 playerId와 mapId 설정
#    - playerId: 원신 UID
#    - mapId: playerId 설정 후 npm run maps 로 확인 가능
#
#    예시:
#    const config: GstsConfig = {
#      compileRoot: '.',
#      entries: ['./src'],
#      outDir: './dist',
#      playerId: 1,
#      mapId: 1073741849,
#    }

# 5. 맵 목록 조회 (mapId 확인용)
npm run maps
```

## 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 증분 컴파일 (파일 변경 감지, 자동 인젝션) |
| `npm run build` | 전체 컴파일 |
| `npm run maps` | 맵 목록 조회 |

## 삭제

프로젝트 폴더를 그대로 삭제하면 됩니다. 글로벌 설정은 건드리지 않습니다.

## genshin-ts 업데이트

프로젝트의 genshin-ts를 최신으로 갱신하려면:

```bash
cd my-project
npm install arca33352285/genshin-ts#personal
```
