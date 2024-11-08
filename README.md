# 1. 실행 방법

#### 1-1. clone

```shell
gh repo clone nueizkk/jasoseol
```

#### 1-2. dependencies 설치

```shell
npm i

```

#### 1-3. 실행

```shell
npm run start

```

<br/>

# 2. 기술 스택과 설계 방식

#### 2-1. dependencies 버전

- "react": "^18.3.1"
- "date-fns": "^4.1.0"

#### 2-2. 설계 방식

1. date-fns 라이브러리를 활용하여 useCalendar 커스텀훅 생성
2. useCalendar로 부터 해당 month에 대한 date list(calendarList)를 가져옴

   ```typescript
   return {
     goToPrevMonth,
     goToNextMonth,
     currentDate: currentDate,
     calendarList: calendarList,
     today: TODAY,
     dayList: DAY_LIST,
     // setCurrentDate: setCurrentDate,
   };
   ```

3. Calendar.tsx에서 달력 페이지 구현

<br/>

# 3. 기타 사항

김지은 <br/>
0529th@naver.com
