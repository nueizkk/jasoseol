import React, { useCallback, useMemo, useState } from 'react';
import { getDaysInMonth } from 'date-fns';

const DAY_OF_WEEK = 7;
const CALENDER_LENGTH = DAY_OF_WEEK * 5;
const DAY_LIST = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];
const TODAY = new Date();

export default function useCalendar() {
  const [currentDate, setCurrentDate] = useState(TODAY);

  const currentMonth = useMemo(() => {
    return new Date(new Date(currentDate).setDate(1));
  }, [currentDate]);
  const prevMonth = useMemo(() => {
    return new Date(
      new Date(new Date(currentDate).setDate(1)).setMonth(
        currentDate.getMonth() - 1
      )
    );
  }, [currentDate]);

  const totalDaysInMonth = getDaysInMonth(currentDate);
  const totalDaysInPrevMonth = getDaysInMonth(prevMonth);

  const prevDayList = Array.from({
    length: currentMonth.getDay(),
  })
    .map((_, i) => totalDaysInPrevMonth - i)
    .reverse();

  const currentDayList = Array.from({ length: totalDaysInMonth }).map(
    (_, i) => i + 1
  );
  const nextDayList = Array.from({
    length: CALENDER_LENGTH - currentDayList.length - prevDayList.length,
  }).map((_, i) => 1 + i);

  const calendarList = prevDayList
    .concat(currentDayList, nextDayList)
    .reduce((acc: number[][], cur, idx) => {
      const chunkIndex = Math.floor(idx / DAY_OF_WEEK);
      if (!acc[chunkIndex]) {
        acc[chunkIndex] = [];
      }
      acc[chunkIndex].push(cur);
      return acc;
    }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentDate(prevMonth);
  }, [setCurrentDate, prevMonth]);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(
      new Date(
        new Date(new Date(currentDate).setDate(1)).setMonth(
          currentDate.getMonth() + 1
        )
      )
    );
  }, [setCurrentDate, currentDate]);

  // const goToToday = useCallback(() => {
  //   setCurrentDate(TODAY);
  // }, [setCurrentDate, TODAY]);

  return {
    goToPrevMonth,
    goToNextMonth,
    currentDate: currentDate,
    calendarList: calendarList,
    today: TODAY,
    dayList: DAY_LIST,
    // setCurrentDate: setCurrentDate,
  };
}
