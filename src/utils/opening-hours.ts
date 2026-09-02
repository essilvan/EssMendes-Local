export interface BusinessScheduleItem {
  day: string;
  hours: string;
  isToday: boolean;
}

export interface BusinessStatusResult {
  isOpen: boolean;
  isOpenNow: boolean;
  label: string;
  subLabel: string;
  badgeText: string;
  detailText: string;
  statusLine: string;
  hasOfficialHours: boolean;
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

export const WEEKDAY_NAMES_PT = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const DEFAULT_WEEKDAY_DESCRIPTIONS = [
  "domingo: Fechado",
  "segunda-feira: 08:00 – 18:00",
  "terça-feira: 08:00 – 18:00",
  "quarta-feira: 08:00 – 18:00",
  "quinta-feira: 08:00 – 18:00",
  "sexta-feira: 08:00 – 18:00",
  "sábado: 08:00 – 14:00",
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
  openingHoursJson?: any
): BusinessStatusResult {
  let hoursArray: string[] | null = null;

  if (Array.isArray(openingHoursJson)) {
    hoursArray = openingHoursJson.filter((h) => typeof h === "string" && h.trim().length > 0);
  } else if (typeof openingHoursJson === "string") {
    try {
      const parsed = JSON.parse(openingHoursJson);
      if (Array.isArray(parsed)) {
        hoursArray = parsed.filter((h) => typeof h === "string" && h.trim().length > 0);
      } else if (openingHoursJson.trim().length > 0) {
        hoursArray = [openingHoursJson];
      }
    } catch {
      if (openingHoursJson.trim().length > 0) {
        hoursArray = [openingHoursJson];
      }
    }
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const dayNamesMap = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];
  const currentDayName = dayNamesMap[dayOfWeek];

  // Se não houver horários configurados
  if (!hoursArray || hoursArray.length === 0) {
    const label = "Aberto para Atendimento";
    const subLabel = "Consulte horários via WhatsApp";
    const defaultSchedule: BusinessScheduleItem[] = dayNamesMap.map((d, i) => ({
      day: d.charAt(0).toUpperCase() + d.slice(1),
      hours: i === 0 ? "Fechado" : i === 6 ? "08:00 – 14:00" : "08:00 – 18:00",
      isToday: i === dayOfWeek,
    }));

    return {
      isOpen: true,
      isOpenNow: true,
      label,
      subLabel,
      badgeText: label,
      detailText: subLabel,
      statusLine: `🟢 ${label} — ${subLabel}`,
      hasOfficialHours: false,
      todayHoursText: "Atendimento Normal",
      scheduleList: defaultSchedule,
    };
  }

  // Constrói a lista dos 7 dias lendo diretamente as 7 entradas do array
  const scheduleList: BusinessScheduleItem[] = dayNamesMap.map((dayName, i) => {
    const matched = hoursArray!.find((line: string) => {
      const lower = line.toLowerCase().trim();
      return (
        lower.startsWith(dayName) ||
        (dayName === "terça-feira" && (lower.startsWith("terca") || lower.startsWith("terça"))) ||
        (dayName === "sábado" && (lower.startsWith("sabado") || lower.startsWith("sábado")))
      );
    });

    let hours = "Consulte";
    if (matched) {
      const parts = matched.split(/:\s*/);
      hours = parts.length >= 2 ? parts.slice(1).join(": ").trim() : matched.trim();
    } else if (i === 0) {
      hours = "Fechado";
    }

    return {
      day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      hours: hours || "Consulte",
      isToday: i === dayOfWeek,
    };
  });

  // Localiza a linha correspondente ao dia atual
  const todayLine = hoursArray.find((line: string) => {
    const lower = line.toLowerCase().trim();
    return (
      lower.startsWith(currentDayName) ||
      (currentDayName === "terça-feira" && (lower.startsWith("terca") || lower.startsWith("terça"))) ||
      (currentDayName === "sábado" && (lower.startsWith("sabado") || lower.startsWith("sábado")))
    );
  });

  if (!todayLine || todayLine.toLowerCase().includes("fechado")) {
    // Procura o próximo dia que abre
    const nextDayIndex = (dayOfWeek + 1) % 7;
    const nextDayLine = hoursArray.find((line: string) => {
      const targetDay = dayNamesMap[nextDayIndex];
      const lower = line.toLowerCase().trim();
      return (
        lower.startsWith(targetDay) ||
        (targetDay === "terça-feira" && (lower.startsWith("terca") || lower.startsWith("terça"))) ||
        (targetDay === "sábado" && (lower.startsWith("sabado") || lower.startsWith("sábado")))
      );
    });

    const nextTime =
      nextDayLine && !nextDayLine.toLowerCase().includes("fechado")
        ? nextDayLine.split(":").slice(1).join(":").trim().split("–")[0]?.trim() || "em breve"
        : "em breve";

    const label = "Fechado no momento";
    const subLabel = `Abre amanhã às ${nextTime}`;

    return {
      isOpen: false,
      isOpenNow: false,
      label,
      subLabel,
      badgeText: label,
      detailText: subLabel,
      statusLine: `🟡 ${label} — ${subLabel}`,
      hasOfficialHours: true,
      todayHoursText: "Fechado",
      scheduleList,
    };
  }

  // Se tiver horários no dia de hoje
  const timeRange = todayLine.split(":").slice(1).join(":").trim();
  const label = "Aberto agora";
  const subLabel = `Hoje: ${timeRange}`;

  return {
    isOpen: true,
    isOpenNow: true,
    label,
    subLabel,
    badgeText: label,
    detailText: subLabel,
    statusLine: `🟢 ${label} — ${subLabel}`,
    hasOfficialHours: true,
    todayHoursText: timeRange,
    scheduleList,
  };
}
