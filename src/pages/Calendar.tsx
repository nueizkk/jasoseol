import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useCalendar from '../hooks/useCalendar';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';

type Data = {
  id: number;
  company_name: string;
  title: string;
  start_time: string;
  end_time: string;
  image_url: string;
  duty_ids: number[];
};

type Duty = {
  id: number;
  name: string;
  parent_id: null | number;
  children: Duty[];
};

export default function Calendar() {
  const { goToNextMonth, goToPrevMonth, calendarList, currentDate, dayList } =
    useCalendar();
  const memoizedCalendarList = useMemo(() => calendarList, [calendarList]);

  //   const [isLoading, setIsLoading] = useState(false);
  const [origin, setOrigin] = useState<Data[] | null>(null);
  const [data, setData] = useState<Data[] | null>(null);
  const [filtered, setFiltered] = useState<
    { date: number; list: Data[] }[][] | null
  >(null);
  const [duties, setDuties] = useState<Omit<Duty, 'children'>[] | null>(null);
  const [job, setJob] = useState<Set<number>>(new Set());
  const [tree, setTree] = useState<Duty[] | null>(null);
  const [sec, setSec] = useState<Duty[] | null>(null);
  const [thi, setThi] = useState<Duty[] | null>(null);
  const [selectedSec, setSelectedSec] = useState<number>();
  const [DutyModal, setDutyModal] = useState(false);
  const [flat, setFlat] = useState<Data[]>();
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [detailsData, setDetailsData] = useState<Data | null>(null);

  const select = useCallback(
    (item: Duty) => {
      const getAllIds = (duty: Duty) => {
        const ids = [duty.id];
        duty.children.forEach((child) => {
          ids.push(...getAllIds(child));
        });
        return ids;
      };

      const ids = getAllIds(item);

      if (job.has(item.id)) {
        setJob((prev) => new Set([...prev].filter((id) => !ids.includes(id))));
      } else {
        setJob((prev) => new Set([...prev, ...ids]));
      }
    },
    [job]
  );

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(
          `https://d1kh1cvi0j04lg.cloudfront.net/api/v1/recruits.json`
        );
        const data: Data[] = await response.json();
        setOrigin(data);
      } catch (error) {
        // console.log(error)
      }
    };
    const getDuties = async () => {
      try {
        const response = await fetch(
          `https://d1kh1cvi0j04lg.cloudfront.net/api/v1/duties.json`
        );
        const data: Omit<Duty, 'children'>[] = await response.json();
        setDuties(data);
        const itemsById: Record<number, Duty> = {};
        data.forEach((item) => {
          itemsById[item.id] = { ...item, children: [] };
        });

        const tree: Duty[] = [];
        data.forEach((item) => {
          if (item.parent_id === null) {
            tree.push(itemsById[item.id]);
          } else {
            itemsById[item.parent_id].children.push(itemsById[item.id]);
          }
        });
        setTree(tree);
      } catch (error) {
        // console.log(error)
      }
    };
    getData();
    getDuties();
  }, []);

  useEffect(() => {
    const dateFilterHandler = () => {
      if (!origin) return;
      const data = origin.filter(
        (d) =>
          new Date(d.start_time).getMonth() === currentDate.getMonth() ||
          new Date(d.end_time).getMonth() === currentDate.getMonth()
      );
      setData(data);
    };
    dateFilterHandler();
  }, [currentDate, origin]);

  useEffect(() => {
    const jobFilterHandler = () => {
      if (!data) return;

      //  직무에 따라 필터링된 데이터
      const filtered =
        job.size === 0
          ? data
          : data.filter((d) => d.duty_ids.some((id) => job.has(id)));

      // 날짜별로 리스트를 정렬한 새로운 memoizedCalendarList 생성

      const updatedCalendarList = memoizedCalendarList.map((week) =>
        week.map((date) => {
          // 시작일 또는 종료일이 현재 date와 일치하는 항목만 필터링
          const currentDateList = filtered.filter(
            (d) =>
              new Date(d.start_time).getDate() === date ||
              new Date(d.end_time).getDate() === date
          );

          // 시작일이 먼저, 종료일이 나중에 오도록 정렬
          currentDateList.sort((a, b) => {
            const isStartA = new Date(a.start_time).getDate() === date;
            const isEndA = new Date(a.end_time).getDate() === date;
            const isStartB = new Date(b.start_time).getDate() === date;
            const isEndB = new Date(b.end_time).getDate() === date;

            if (isStartA && !isStartB) return -1;
            if (!isStartA && isStartB) return 1;
            if (isEndA && !isEndB) return 1;
            if (!isEndA && isEndB) return -1;
            return 0;
          });

          return { date, list: currentDateList };
        })
      );
      // 상태 업데이트가 기존 filtered와 다를 때만 setFiltered 호출
      setFiltered((prev) =>
        JSON.stringify(prev) === JSON.stringify(updatedCalendarList)
          ? prev
          : updatedCalendarList
      );
    };

    jobFilterHandler();
  }, [job, data, memoizedCalendarList]);

  useEffect(() => {
    setFlat(filtered?.flatMap((week) => week.flatMap((date) => date.list)));
  }, [filtered]);

  useEffect(() => {
    if (!detailsId) return;
    const selected = flat?.find((d) => d.id === detailsId);
    if (!selected) return;
    setDetailsData(selected);
  }, [detailsId, flat]);

  useEffect(() => {
    if (detailsId) setDutyModal(false);
  }, [detailsId]);
  return (
    <div>
      {/* filter */}
      <div className='filter_container'>
        <div
          onClick={() => setDutyModal((prev) => !prev)}
          className='filter_button'
        >
          <div>
            <div>직무</div>
            <div>{job.size ? job.size + '개' : '직무선택'}</div>
          </div>
          <ChevronDownIcon width={16} height={16} />
        </div>
        {DutyModal && (
          <div className='filter_modal'>
            {/* {!tree && <LoadingSpinner/>} */}
            <div className='filter_first'>
              {tree?.map((f) => (
                <div
                  key={f.id}
                  className='filter_first_item'
                  onClick={() => {
                    setSec(f.children);
                  }}
                  style={
                    f.id === sec?.[0].parent_id ? { background: '#eee' } : {}
                  }
                >
                  <div>
                    <span onClick={() => select(f)}>
                      {job.has(f.id) ? (
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 20 20'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M3.33333 2.5H16.6667C16.8877 2.5 17.0996 2.5878 17.2559 2.74408C17.4122 2.90036 17.5 3.11232 17.5 3.33333V16.6667C17.5 16.8877 17.4122 17.0996 17.2559 17.2559C17.0996 17.4122 16.8877 17.5 16.6667 17.5H3.33333C3.11232 17.5 2.90036 17.4122 2.74408 17.2559C2.5878 17.0996 2.5 16.8877 2.5 16.6667V3.33333C2.5 3.11232 2.5878 2.90036 2.74408 2.74408C2.90036 2.5878 3.11232 2.5 3.33333 2.5ZM9.16917 13.3333L15.0608 7.44083L13.8825 6.2625L9.16917 10.9767L6.81167 8.61917L5.63333 9.7975L9.16917 13.3333Z'
                            fill='#7084FA'
                          />
                        </svg>
                      ) : (
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 20 20'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M3.33333 2.5H16.6667C16.8877 2.5 17.0996 2.5878 17.2559 2.74408C17.4122 2.90036 17.5 3.11232 17.5 3.33333V16.6667C17.5 16.8877 17.4122 17.0996 17.2559 17.2559C17.0996 17.4122 16.8877 17.5 16.6667 17.5H3.33333C3.11232 17.5 2.90036 17.4122 2.74408 17.2559C2.5878 17.0996 2.5 16.8877 2.5 16.6667V3.33333C2.5 3.11232 2.5878 2.90036 2.74408 2.74408C2.90036 2.5878 3.11232 2.5 3.33333 2.5ZM4.16667 4.16667V15.8333H15.8333V4.16667H4.16667Z'
                            fill='#999999'
                          />
                        </svg>
                      )}
                    </span>
                    {f.name}
                  </div>
                  {f.children.length > 0 && (
                    <ChevronRightIcon width={14} height={14} color='#444' />
                  )}
                </div>
              ))}
            </div>
            <div className='filter_second'>
              {sec?.map((s) => (
                <div
                  key={s.id}
                  className='filter_second_item'
                  onClick={() => {
                    setThi(s.children);
                    setSelectedSec(s.id);
                  }}
                  style={s.id === selectedSec ? { background: '#eee' } : {}}
                >
                  <div>
                    <span onClick={() => select(s)}>
                      {job.has(s.id) ? (
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 20 20'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M3.33333 2.5H16.6667C16.8877 2.5 17.0996 2.5878 17.2559 2.74408C17.4122 2.90036 17.5 3.11232 17.5 3.33333V16.6667C17.5 16.8877 17.4122 17.0996 17.2559 17.2559C17.0996 17.4122 16.8877 17.5 16.6667 17.5H3.33333C3.11232 17.5 2.90036 17.4122 2.74408 17.2559C2.5878 17.0996 2.5 16.8877 2.5 16.6667V3.33333C2.5 3.11232 2.5878 2.90036 2.74408 2.74408C2.90036 2.5878 3.11232 2.5 3.33333 2.5ZM9.16917 13.3333L15.0608 7.44083L13.8825 6.2625L9.16917 10.9767L6.81167 8.61917L5.63333 9.7975L9.16917 13.3333Z'
                            fill='#7084FA'
                          />
                        </svg>
                      ) : (
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 20 20'
                          fill='none'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            d='M3.33333 2.5H16.6667C16.8877 2.5 17.0996 2.5878 17.2559 2.74408C17.4122 2.90036 17.5 3.11232 17.5 3.33333V16.6667C17.5 16.8877 17.4122 17.0996 17.2559 17.2559C17.0996 17.4122 16.8877 17.5 16.6667 17.5H3.33333C3.11232 17.5 2.90036 17.4122 2.74408 17.2559C2.5878 17.0996 2.5 16.8877 2.5 16.6667V3.33333C2.5 3.11232 2.5878 2.90036 2.74408 2.74408C2.90036 2.5878 3.11232 2.5 3.33333 2.5ZM4.16667 4.16667V15.8333H15.8333V4.16667H4.16667Z'
                            fill='#999999'
                          />
                        </svg>
                      )}
                    </span>
                    {s.name}
                  </div>
                  {s.children.length > 0 && (
                    <ChevronRightIcon width={14} height={14} color='#444' />
                  )}
                </div>
              ))}
            </div>
            <div className='filter_third'>
              {thi?.map((t) => (
                <div
                  key={t.id}
                  className='filter_third_item'
                  onClick={() => select(t)}
                  style={
                    job.has(t.id)
                      ? {
                          borderColor: 'rgba(112, 132, 250, 0.32)',
                          background: 'rgba(112, 132, 250, 0.08)',
                        }
                      : {}
                  }
                >
                  {t.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* nav */}
      <div className='nav'>
        <span className='nav-button' onClick={goToPrevMonth}>
          <ChevronLeftIcon width={22} height={22} color='rgb(200, 195, 188)' />
        </span>
        <span className='nav-title'>{`${format(currentDate, 'yyyy.MM')}`}</span>
        <span className='nav-button' onClick={goToNextMonth}>
          <ChevronRightIcon width={22} height={22} color='rgb(200, 195, 188)' />
        </span>
      </div>
      {/* calendar */}
      <table className='calendar'>
        <thead>
          <tr className='calendar_day'>
            {dayList.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered?.map((week, index) => (
            <tr key={index}>
              {week.map((d) => (
                <td key={d.date} className='calendar_item'>
                  <div className='date'>{d.date}</div>
                  <ul>
                    {d.list.map((i) => (
                      <li key={i.id} onClick={() => setDetailsId(i.id)}>
                        <div
                          className='calendar_list_icon'
                          style={
                            d.date === new Date(i.end_time).getDate()
                              ? { background: '#3f4b5e' }
                              : {}
                          }
                        >
                          {d.date === new Date(i.end_time).getDate()
                            ? '끝'
                            : '시'}
                        </div>
                        {i.company_name}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* details */}
      {detailsId && detailsData && (
        <div className='details'>
          <div
            className='details-modal-close-button'
            onClick={() => setDetailsId(null)}
          >
            <XMarkIcon width={36} height={36} color='#fff' />
          </div>
          <div
            className='details-modal-arrow'
            onClick={() => {
              if (!flat) return;
              const idx = flat.findIndex((i) => i.id === detailsId);
              setDetailsId(flat[idx - 1].id);
            }}
          >
            <ChevronLeftIcon
              width={48}
              height={48}
              color='rgb(200, 195, 188)'
            />
          </div>
          <div className='details-modal'>
            <div>기업명: {detailsData.company_name}</div>
            <div>제목: {detailsData.title}</div>
            <div>
              직무:{' '}
              {detailsData.duty_ids
                .map((id) => duties?.find((i) => i.id === id)?.name)
                .join(', ')}
            </div>
            <div>시작일: {format(detailsData.start_time, 'yyyy-MM-dd')}</div>
            <div>마감일: {format(detailsData.end_time, 'yyyy-MM-dd')}</div>

            <div className='details-modal-img'>
              <img src={detailsData?.image_url} alt={detailsData.title} />
            </div>
          </div>
          <div
            className='details-modal-arrow'
            onClick={() => {
              if (!flat) return;
              const idx = flat.findIndex((i) => i.id === detailsId);
              setDetailsId(flat[idx + 1].id);
            }}
          >
            <ChevronRightIcon
              width={48}
              height={48}
              color='rgb(200, 195, 188)'
            />
          </div>
        </div>
      )}
    </div>
  );
}
