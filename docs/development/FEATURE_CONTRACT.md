# 기능 생성 계약

확장계획 2번의 2-8단계 산출물이다. react-boilerplate와 vue-boilerplate의
계약을 그대로 옮기지 않는다. 셋 중 이 저장소의 관례가 가장 다르다.

---

## 조사 — 기존 여덟 기능은 무엇을 갖고 있나

| 기능 | views | scss | `.client.tsx` | stories | tests |
| --- | --- | --- | --- | --- | --- |
| `auth` | – | 1 | 1 | 1 | 1 |
| `user` | – | – | – | – | – |
| `dashboard` | 1 | 1 | 1 | – | – |
| `ops` | 2 | 2 | 1 | – | 1 |
| `customizable-dashboard` | 2 | 1 | – | 1 | 7 |
| `visual-graph` | 3 | 3 | – | 1 | 8 |
| `live-experience` | 3 | 1 | – | 1 | 5 |
| `refactoring-case` | – | – | 2 | – | 1 |

**`src/features/` 안에는 보편적인 것이 없다.** views도, story도, test도 전부
일부만 갖는다. `user`는 dto와 server 파일 둘뿐이고 화면이 없으며,
`refactoring-case`는 client 컴포넌트만 갖는다.

보편적인 것은 다른 곳에 있다. **화면에 도달할 수 있는 모든 기능은
`src/app/` 아래에 `page.tsx`를 갖는다.** react는 route 파일을 기능 폴더
안에 두고 vue는 모듈 안에 두지만, 여기서는 라우팅이 파일 시스템에 있고
기능 폴더와 물리적으로 분리되어 있다.

```
src/app/(auth)/login/page.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/examples/{dashboard,graph,live}/page.tsx
src/app/ops-console/page.tsx
```

따라서 이 저장소에서 "기능을 만든다"는 것은 **두 곳에 파일을 만드는 일**이다.
하나만 만들면 코드가 있으나 열 수 없거나, 페이지가 있으나 보여줄 것이 없다.

---

## 계약

### 항상 만든다

| 경로 | 이유 |
| --- | --- |
| `src/features/<name>/views/<Name>View.tsx` | 화면의 본체 |
| `src/features/<name>/views/<Name>View.module.scss` | 여덟 중 여섯이 CSS 모듈을 쓴다 |
| `src/features/<name>/views/<Name>View.stories.tsx` | 아래 참고 |
| `src/features/<name>/views/<Name>View.test.tsx` | 아래 참고 |
| `src/app/<name>/page.tsx` | 없으면 도달할 수 없다 |

### 만들지 않는다

- 빈 디렉터리. 지금 생성기는 `actions`, `components`, `dto`, `server`,
  `views` 다섯 개를 만들고 그중 셋을 비워둔다.
- `dto/`와 `server/`. 데이터를 가져오는 기능일 때만 필요하고, 그 형태는
  기능마다 다르다. `user`는 `server/users.server.ts` 하나로 끝나고
  `customizable-dashboard`는 `data/` 아래 여섯 파일을 쓴다.
- `.client.tsx` 컴포넌트. 상호작용이 필요할 때 추가하는 것이지 기본이 아니다.

---

## 서버 컴포넌트가 기본이다

생성된 뷰에는 `"use client"`를 넣지 않는다.

이 저장소의 존재 이유가 서버 우선 경계이기 때문이다. 기본을 client로 두면
새 화면마다 클라이언트 번들이 늘고, 서버에서 할 수 있는 일을 브라우저로
미루게 된다. 상호작용이 필요해지면 그 부분만 `.client.tsx`로 떼어내는 것이
기존 기능들이 실제로 하고 있는 방식이다. `dashboard`는 서버 뷰 안에
`RefreshableUsers.client.tsx`를 두고, `auth`는 `LoginForm.client.tsx`를 둔다.

`page.tsx`도 서버 컴포넌트로 만들고 `metadata`를 내보낸다. 기존 페이지들이
모두 그렇게 되어 있다.

---

## 관례를 앞서가는 부분

**story는 여덟 중 넷, test는 여덟 중 다섯이 갖고 있는데 생성기는 둘 다
만든다.** 절반 정도가 따르는 관례이므로 생성기가 앞서 있는 셈이다. 그대로
둔다. 생성기가 빠뜨리면 나중에 붙는 일은 거의 없다.

기존 기능을 소급해 고치지 않는다. 계약은 앞으로 만들어질 것에 적용된다.
