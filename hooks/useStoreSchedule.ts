"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_STORE_SCHEDULE,
  type StoreSchedule,
} from "@/lib/store-hours";

export function useStoreSchedule() {
  const [schedule, setSchedule] = useState<StoreSchedule>(DEFAULT_STORE_SCHEDULE);

  useEffect(() => {
    let active = true;
    fetch("/api/store-schedule")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.schedule) setSchedule(data.schedule);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return schedule;
}
