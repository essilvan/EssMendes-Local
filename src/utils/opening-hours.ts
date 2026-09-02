export interface BusinessScheduleItem {
  day: string;
  hours: string;
  isToday: boolean;
}

export interface BusinessStatusResult {
  isOpen: boolean;
  isOpenNow: boolean;
  badgeText: string;
  subText: string;
  label: string;
  subLabel: string;
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
 * e calcula dinamicamente se o estabelecimento está aberto no momento atual com fuso de Brasília.
 */
export function getBusinessStatus(
  openingHoursJson?: any
): BusinessStatusResult {
  // 1. Horário atual exato em Brasília (America/Sao_Paulo)
  const now = new Date();
  const brasiliaFormatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    minute: "numeric",
    weekday: "long",
    hour12: false,
  });

  const parts = brasiliaFormatter.formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const currentMinute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  const currentWeekday = (parts.find((p) => p.type === "weekday")?.value || "").toLowerCase().trim();

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

  const dayNamesMap = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  const defaultSchedule: BusinessScheduleItem[] = dayNamesMap.map((d) => ({
    day: d.charAt(0).toUpperCase() + d.slice(1),
    hours: d === "domingo" ? "Fechado" : d === "sábado" ? "08:00 – 14:00" : "08:00 – 18:00",
    isToday: currentWeekday.startsWith(d.substring(0, 3)),
  }));

  // 2. Se não houver dados no banco
  if (!hoursArray || hoursArray.length === 0) {
    const badgeText = "Horário sob consulta";
    const subText = "Consulte atendimento via WhatsApp";
    return {
      isOpen: false,
      isOpenNow: false,
      badgeText,
      subText,
      label: badgeText,
      subLabel: subText,
      detailText: subText,
      statusLine: `🟡 ${badgeText} — ${subText}`,
      hasOfficialHours: false,
      todayHoursText: "Sob consulta",
      scheduleList: defaultSchedule,
    };
  }

  // Monta scheduleList com as 7 entradas reais
  const scheduleList: BusinessScheduleItem[] = dayNamesMap.map((dayName) => {
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
      const p = matched.split(/:\s*/);
      hours = p.length >= 2 ? p.slice(1).join(": ").trim() : matched.trim();
    } else if (dayName === "domingo") {
      hours = "Fechado";
    }

    const isToday =
      currentWeekday.startsWith(dayName.substring(0, 3)) ||
      (dayName === "terça-feira" && (currentWeekday.startsWith("terca") || currentWeekday.startsWith("terça"))) ||
      (dayName === "sábado" && (currentWeekday.startsWith("sabado") || currentWeekday.startsWith("sábado")));

    return {
      day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      hours: hours || "Consulte",
      isToday,
    };
  });

  // 3. Localizar a linha do dia atual
  const todayEntry = hoursArray.find((line: string) => {
    const lower = line.toLowerCase().trim();
    return (
      lower.startsWith(currentWeekday) ||
      (currentWeekday.startsWith("ter") && (lower.startsWith("terca") || lower.startsWith("terça"))) ||
      (currentWeekday.startsWith("s") && (lower.startsWith("sabado") || lower.startsWith("sábado"))) ||
      (currentWeekday.startsWith("dom") && lower.startsWith("domingo")) ||
      (currentWeekday.startsWith("seg") && lower.startsWith("segunda")) ||
      (currentWeekday.startsWith("qua") && lower.startsWith("quarta")) ||
      (currentWeekday.startsWith("qui") && lower.startsWith("quinta")) ||
      (currentWeekday.startsWith("sex") && lower.startsWith("sexta"))
    );
  });

  if (!todayEntry || todayEntry.toLowerCase().includes("fechado")) {
    const badgeText = "Fechado no momento";
    const subText = "Fechado hoje";
    return {
      isOpen: false,
      isOpenNow: false,
      badgeText,
      subText,
      label: badgeText,
      subLabel: subText,
      detailText: subText,
      statusLine: `🟡 ${badgeText} — ${subText}`,
      hasOfficialHours: true,
      todayHoursText: "Fechado",
      scheduleList,
    };
  }

  // 4. Extrair os horários (ex: "08:00 – 18:00" ou "11:00 – 00:00")
  const rawTimes = todayEntry.split(":").slice(1).join(":").trim();
  // Normaliza travessões (–, -, —)
  const [startStr, endStr] = rawTimes.split(/[–—-]/).map((s) => s.trim());

  if (!startStr || !endStr) {
    const badgeText = "Fechado";
    const subText = rawTimes || "Fechado hoje";
    return {
      isOpen: false,
      isOpenNow: false,
      badgeText,
      subText,
      label: badgeText,
      subLabel: subText,
      detailText: subText,
      statusLine: `🟡 ${badgeText} — ${subText}`,
      hasOfficialHours: true,
      todayHoursText: rawTimes,
      scheduleList,
    };
  }

  const [openH, openM] = startStr.split(":").map(Number);
  let [closeH, closeM] = endStr.split(":").map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  // Se fechar às 00:00 (meia-noite), converte para 24:00 (1440 minutos)
  let closeMinutes = closeH * 60 + (closeM || 0);
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60; // Caso vire a noite (ex: 11:00 às 00:00)
  }

  let adjustedCurrentMinutes = currentTotalMinutes;
  if (closeMinutes > 24 * 60 && currentTotalMinutes < openMinutes) {
    adjustedCurrentMinutes += 24 * 60;
  }

  // 5. Comparação precisa de minutos
  const isCurrentlyOpen =
    adjustedCurrentMinutes >= openMinutes && adjustedCurrentMinutes < closeMinutes;

  if (isCurrentlyOpen) {
    const badgeText = "Aberto agora";
    const subText = `Fecha às ${endStr}`;
    return {
      isOpen: true,
      isOpenNow: true,
      badgeText,
      subText,
      label: badgeText,
      subLabel: subText,
      detailText: subText,
      statusLine: `🟢 ${badgeText} — ${subText}`,
      hasOfficialHours: true,
      todayHoursText: rawTimes,
      scheduleList,
    };
  } else {
    const badgeText = "Fechado no momento";
    const subText = `Abre às ${startStr}`;
    return {
      isOpen: false,
      isOpenNow: false,
      badgeText,
      subText,
      label: badgeText,
      subLabel: subText,
      detailText: subText,
      statusLine: `🟡 ${badgeText} — ${subText}`,
      hasOfficialHours: true,
      todayHoursText: rawTimes,
      scheduleList,
    };
  }
}
