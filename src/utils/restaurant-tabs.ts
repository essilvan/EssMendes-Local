import type { RestaurantOrder, RestaurantOrderItem } from "@/types";

export interface ConsolidatedTabItem {
  key: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OpenTableTab {
  tabKey: string;
  tableNumber: string;
  tableLabel: string;
  isIndividualTab: boolean;
  customerName: string;
  customerPhone: string | null;
  title: string;
  orderIds: string[];
  orders: RestaurantOrder[];
  roundsCount: number;
  consolidatedItems: ConsolidatedTabItem[];
  subtotal: number;
  firstOrderAt: string;
  lastOrderAt: string;
}

export function normalizeTableKey(tableNumber?: string | null): string {
  const raw = String(tableNumber || "").trim();
  if (!raw) return "balcao";
  const cleaned = raw.toLowerCase().replace(/^mesa\s*/i, "").replace(/^0+/, "");
  return cleaned || "0";
}

export function formatTabTableLabel(tableNumber?: string | null): string {
  const raw = String(tableNumber || "").trim();
  const lower = raw.toLowerCase();
  if (
    !raw ||
    raw === "0" ||
    lower === "balcão" ||
    lower === "balcao" ||
    lower === "retirada" ||
    lower === "vitrine" ||
    lower === "delivery"
  ) {
    return "Balcão / Delivery";
  }
  return `Mesa ${raw}`;
}

export function groupOpenRestaurantTabs(orders: RestaurantOrder[]): OpenTableTab[] {
  const openOrders = (orders || []).filter((o) => {
    const status = String(o.status || "").toLowerCase();
    return !o.is_paid && status !== "canceled";
  });

  const map = new Map<string, RestaurantOrder[]>();

  for (const order of openOrders) {
    const tableKey = normalizeTableKey(order.table_number);
    const isInd = Boolean(order.is_individual_tab);
    let key: string;
    if (isInd) {
      const cleanPhone = String(order.customer_phone || "").replace(/\D/g, "");
      const cleanName = String(order.customer_name || "cliente")
        .trim()
        .toLowerCase();
      key = `table:${tableKey}::ind::${cleanPhone || cleanName}`;
    } else {
      key = `table:${tableKey}::shared`;
    }

    const list = map.get(key) || [];
    list.push(order);
    map.set(key, list);
  }

  const result: OpenTableTab[] = [];

  map.forEach((groupOrders, tabKey) => {
    const sorted = [...groupOrders].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const isIndividualTab = Boolean(first.is_individual_tab);
    const tableLabel = formatTabTableLabel(first.table_number);

    // Pick best customer name/phone from group (latest non-empty)
    let customerName = first.customer_name || "Cliente na Mesa";
    let customerPhone: string | null = null;
    for (const o of sorted) {
      if (o.customer_name && o.customer_name.trim()) {
        customerName = o.customer_name.trim();
      }
      if (o.customer_phone && o.customer_phone.trim()) {
        customerPhone = o.customer_phone.trim();
      }
    }

    // Consolidate items across rounds
    const itemMap = new Map<string, ConsolidatedTabItem>();
    let subtotal = 0;

    for (const o of sorted) {
      subtotal += Number(o.total_amount || 0);
      for (const it of (o.items || []) as RestaurantOrderItem[]) {
        const name = String(it.name || "Item").trim();
        const price = Number(it.price || 0);
        const qty = Number(it.quantity || 1);
        const itemKey = `${name.toLowerCase()}::${price.toFixed(2)}`;
        const existing = itemMap.get(itemKey);
        if (existing) {
          existing.quantity += qty;
          existing.subtotal = Number((existing.quantity * existing.price).toFixed(2));
        } else {
          itemMap.set(itemKey, {
            key: itemKey,
            name,
            price,
            quantity: qty,
            subtotal: Number((qty * price).toFixed(2)),
          });
        }
      }
    }

    const title = isIndividualTab
      ? `${tableLabel} - Comanda Individual: ${customerName}`
      : `${tableLabel} - Conta Geral`;

    result.push({
      tabKey,
      tableNumber: first.table_number,
      tableLabel,
      isIndividualTab,
      customerName,
      customerPhone,
      title,
      orderIds: sorted.map((o) => o.id),
      orders: sorted,
      roundsCount: sorted.length,
      consolidatedItems: Array.from(itemMap.values()),
      subtotal: Number(subtotal.toFixed(2)),
      firstOrderAt: first.created_at,
      lastOrderAt: last.created_at,
    });
  });

  // Sort by most recently active table first
  return result.sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  );
}

export function formatTabCurrency(val: number): string {
  return `R$ ${Number(val || 0).toFixed(2).replace(".", ",")}`;
}

export function printOpenTabStatement80mm(params: {
  tenantName: string;
  tab: OpenTableTab;
  includeServiceFee: boolean;
  serviceFeePercent: number;
}) {
  const { tenantName, tab, includeServiceFee, serviceFeePercent } = params;
  const printWindow = window.open("", "_blank", "width=350,height=650");
  if (!printWindow) {
    alert("Permita pop-ups no navegador para imprimir o extrato da conta.");
    return;
  }

  const escapeHtml = (val: string) =>
    String(val || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const feeAmount = includeServiceFee
    ? Number((tab.subtotal * (serviceFeePercent / 100)).toFixed(2))
    : 0;
  const finalTotal = Number((tab.subtotal + feeAmount).toFixed(2));

  const nowFormatted = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHtml = tab.consolidatedItems
    .map(
      (it) => `
      <div class="item-row">
        <span class="item-name">${it.quantity}x ${escapeHtml(it.name)}</span>
        <span class="item-price">${formatTabCurrency(it.subtotal)}</span>
      </div>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Extrato - ${escapeHtml(tab.title)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      width: 72mm;
      margin: 0 auto;
      padding: 4px 0;
      color: #000;
      background: #fff;
      font-size: 12px;
      line-height: 1.35;
    }
    .center { text-align: center; }
    .restaurant-name { font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
    .subtitle { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
    .date-line { font-size: 10px; margin-bottom: 8px; }
    .table-box {
      border: 1px solid #000;
      padding: 6px;
      margin: 6px 0;
      text-align: center;
    }
    .table-title { font-size: 14px; font-weight: bold; }
    .meta { font-size: 11px; margin-top: 3px; }
    .divider { margin: 8px 0; text-align: center; font-size: 11px; letter-spacing: -0.5px; }
    .item-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 4px; }
    .item-name { flex: 1; font-weight: bold; word-break: break-word; }
    .item-price { white-space: nowrap; font-weight: bold; }
    .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: bold;
      margin: 6px 0;
      padding-top: 4px;
      border-top: 1px solid #000;
    }
    .footer {
      margin-top: 12px;
      text-align: center;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="restaurant-name">${escapeHtml(tenantName)}</div>
    <div class="subtitle">EXTRATO DA CONTA (CONFERÊNCIA)</div>
    <div class="date-line">${escapeHtml(nowFormatted)}</div>
  </div>

  <div class="table-box">
    <div class="table-title">${escapeHtml(tab.title)}</div>
    <div class="meta">${tab.roundsCount} ${tab.roundsCount === 1 ? "rodada" : "rodadas"} • Cliente: ${escapeHtml(tab.customerName)}</div>
  </div>

  <div class="divider">--------------------------------</div>

  <div>
    ${itemsHtml}
  </div>

  <div class="divider">--------------------------------</div>

  <div class="summary-row">
    <span>Subtotal dos Itens:</span>
    <span>${formatTabCurrency(tab.subtotal)}</span>
  </div>

  <div class="summary-row">
    <span>Taxa de Serviço (${serviceFeePercent}%${includeServiceFee ? " - Opcional" : " - Não cobrada"}):</span>
    <span>${formatTabCurrency(feeAmount)}</span>
  </div>

  <div class="total-row">
    <span>TOTAL A PAGAR:</span>
    <span>${formatTabCurrency(finalTotal)}</span>
  </div>

  <div class="footer">
    Obrigado pela preferência!<br/>
    EssMendes Local
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.close();
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

