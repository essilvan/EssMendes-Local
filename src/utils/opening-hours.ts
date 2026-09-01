export interface BusinessScheduleItem {
  day: string;
  hours: string;
  isToday: boolean;
}

export interface BusinessStatusResult {
  isOpenNow: boolean;
  hasOfficialHours: boolean;
  badgeText: string;
  detailText: string;
  statusLine: string;
  todayHoursText: string;
  scheduleList: BusinessScheduleItem[];
}

export const daysMap: Record<string, string> = {
  domingo: "Domingo",
  "segunda-feira": "Segunda-feira",
  "terça-feira": "Terça-feira",
  "terca-feira": "Terça-feira",
  "quarta-feira": "Quarta-feira",
  "quinta-feira": "Quinta-feira",
  "sexta-feira": "Sexta-feira",
  sábado: "Sábado",
  sabado: "Sábado",
};

const WEEKDAY_NAMES_PT = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const DEFAULT_WEEKDAY_DESCRIPTIONS = [
  "segunda-feira: 08:00 – 18:00",
  "terça-feira: 08:00 – 18:00",
  "quarta-feira: 08:00 – 18:00",
  "quinta-feira: 08:00 – 18:00",
  "sexta-feira: 08:00 – 18:00",
  "sábado: 08:00 – 14:00",
  "domingo: Fechado",
];

/**
 * Faz o parsing do array de horários retornados pelo Google Places
 */
export function parseGoogleOpeningHours(
  rawOpeningHours?: string[] | null
): Array<{ day: string; time: string }> | null {
  if (!rawOpeningHours || !Array.isArray(rawOpeningHours) || rawOpeningHours.length === 0) {
    return null;
  }
  return rawOpeningHours.map((line: string) => {
    const [day, ...timeParts] = line.split(":");
    const time = timeParts.join(":").trim();
    const cleanDay = day.trim().toLowerCase();
    const formattedDay = daysMap[cleanDay] || day.trim();
    return {
      day: formattedDay,
      time: time || "Fechado",
    };
  });
}

/**
 * Normaliza e analisa os horários de funcionamento fornecidos pela Google Places API
 * e calcula dinamicamente se o estabelecimento está aberto no momento atual.
 */
export function getBusinessStatus(
  rawOpeningHours?: string[] | null
): BusinessStatusResult {
  const hasOfficialHours = Boolean(
    rawOpeningHours && Array.isArray(rawOpeningHours) && rawOpeningHours.length > 0
  );
  const descriptions = hasOfficialHours
    ? (rawOpeningHours as string[])
    : DEFAULT_WEEKDAY_DESCRIPTIONS;

  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 = Domingo, 1 = Segunda ... 6 = Sábado
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Mapeia descrições para a lista formatada da semana
  const scheduleList: BusinessScheduleItem[] = [];

  for (let i = 0; i < 7; i++) {
    const dayName = WEEKDAY_NAMES_PT[i];
    const isToday = i === currentDayIndex;

    // Procura na lista da API a linha correspondente ao dia
    const matchedLine = descriptions.find((desc) => {
      const lower = desc.toLowerCase().trim();
      return (
        lower.startsWith(dayName) ||
        (dayName === "terça-feira" && (lower.startsWith("terca") || lower.startsWith("terça"))) ||
        (dayName === "sábado" && (lower.startsWith("sabado") || lower.startsWith("sábado")))
      );
    });

    let hoursText = "08:00 – 18:00";
    if (matchedLine) {
      const parts = matchedLine.split(/:\s*/);
      if (parts.length >= 2) {
        hoursText = parts.slice(1).join(": ").trim();
      } else {
        hoursText = matchedLine;
      }
    } else if (i === 0) {
      hoursText = "Fechado";
    } else if (i === 6) {
      hoursText = "08:00 – 14:00";
    }

    scheduleList.push({
      day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      hours: hoursText,
      isToday,
    });
  }

  // Identifica o horário de hoje
  const todayItem = scheduleList[currentDayIndex];
  const todayHours = todayItem ? todayItem.hours : "08:00 – 18:00";

  let isOpenNow = false;
  let badgeText = "Fechado no momento";
  let detailText = "Abre amanhã às 08:00";
  let closeTimeStr = "18:00";

  const lowerTodayHours = todayHours.toLowerCase();

  if (lowerTodayHours.includes("24 horas") || lowerTodayHours.includes("aberto 24h")) {
    isOpenNow = true;
    badgeText = "Aberto agora";
    detailText = "Atendimento 24 horas";
  } else if (lowerTodayHours.includes("fechado")) {
    isOpenNow = false;
    badgeText = "Fechado no momento";

    // Procura o próximo dia aberto a partir de amanhã
    const nextOpenDay =
      scheduleList.find(
        (item, idx) => idx > currentDayIndex && !item.hours.toLowerCase().includes("fechado")
      ) || scheduleList.find((item) => !item.hours.toLowerCase().includes("fechado"));

    if (nextOpenDay) {
      const isTomorrow =
        (currentDayIndex + 1) % 7 ===
        scheduleList.findIndex((item) => item.day === nextOpenDay.day);
      const openHourMatch = nextOpenDay.hours.match(/(\d{1,2}:\d{2})/);
      const nextOpenHour = openHourMatch ? openHourMatch[1] : "08:00";

      detailText = isTomorrow
        ? `Abre amanhã às ${nextOpenHour}`
        : `Abre ${nextOpenDay.day.toLowerCase()} às ${nextOpenHour}`;
    } else {
      detailText = "Consulte horários para agendamento";
    }
  } else {
    // Tenta extrair intervalos no formato "08:00 – 18:00" ou "08:00 - 12:00, 14:00 - 18:00"
    const timeRanges = todayHours.split(/[,;]/);
    let matchedOpen = false;
    let nextOpenLaterToday: string | null = null;

    for (const range of timeRanges) {
      const match = range.match(/(\d{1,2}):(\d{2})\s*[–\-—a]\s*(\d{1,2}):(\d{2})/);
      if (match) {
        const openMin = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        const closeMin = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
        const formattedClose = `${match[3].padStart(2, "0")}:${match[4].padStart(2, "0")}`;

        if (currentMinutes >= openMin && currentMinutes < closeMin) {
          matchedOpen = true;
          closeTimeStr = formattedClose;
          break;
        } else if (currentMinutes < openMin && !nextOpenLaterToday) {
          nextOpenLaterToday = `${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}`;
        }
      }
    }

    if (matchedOpen) {
      isOpenNow = true;
      badgeText = "Aberto agora";
      detailText = `Atendimento até às ${closeTimeStr}`;
    } else if (nextOpenLaterToday) {
      isOpenNow = false;
      badgeText = "Fechado no momento";
      detailText = `Abre hoje às ${nextOpenLaterToday}`;
    } else {
      isOpenNow = false;
      badgeText = "Fechado no momento";
      const tomorrowIndex = (currentDayIndex + 1) % 7;
      const tomorrowItem = scheduleList[tomorrowIndex];

      if (tomorrowItem && !tomorrowItem.hours.toLowerCase().includes("fechado")) {
        const openMatch = tomorrowItem.hours.match(/(\d{1,2}:\d{2})/);
        const tomorrowOpenHour = openMatch ? openMatch[1] : "08:00";
        detailText = `Abre amanhã às ${tomorrowOpenHour}`;
      } else {
        const nextOpenDay =
          scheduleList.find(
            (item, idx) => idx > currentDayIndex && !item.hours.toLowerCase().includes("fechado")
          ) || scheduleList.find((item) => !item.hours.toLowerCase().includes("fechado"));

        if (nextOpenDay) {
          const openHourMatch = nextOpenDay.hours.match(/(\d{1,2}:\d{2})/);
          const nextOpenHour = openHourMatch ? openHourMatch[1] : "08:00";
          detailText = `Abre ${nextOpenDay.day.toLowerCase()} às ${nextOpenHour}`;
        } else {
          detailText = "Consulte horários para agendamento";
        }
      }
    }
  }

  const statusLine = isOpenNow
    ? `🟢 ${badgeText} — ${detailText}`
    : `🟡 ${badgeText} — ${detailText}`;

  return {
    isOpenNow,
    hasOfficialHours,
    badgeText,
    detailText,
    statusLine,
    todayHoursText: todayHours,
    scheduleList,
  };
}
