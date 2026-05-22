"use client";

import { useEffect, useState } from "react";
import { Message } from "@/components/Message";
import { RequireAuth } from "@/components/RequireAuth";
import { api, formatDateTime } from "@/lib/api";
import type { AdminAuditActionType, AdminAuditLogResponse, AdminAuditTargetType } from "@/types/api";

const actionTypeLabels: Record<AdminAuditActionType, string> = {
  PRODUCT_CREATED: "상품 등록",
  PRODUCT_UPDATED: "상품 수정",
  PRODUCT_HIDDEN: "상품 숨김",
  ORDER_PREPARED: "배송 준비 처리",
  ORDER_SHIPPED: "발송 처리",
  ORDER_DELIVERED: "배송 완료 처리",
  PAYMENT_CANCELED: "결제 취소/환불"
};

const targetTypeLabels: Record<AdminAuditTargetType, string> = {
  PRODUCT: "상품",
  ORDER: "주문",
  PAYMENT: "결제"
};

function actionLabel(actionType: AdminAuditActionType) {
  return actionTypeLabels[actionType] ?? actionType;
}

function targetLabel(targetType: AdminAuditTargetType) {
  return targetTypeLabels[targetType] ?? targetType;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogResponse[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminAuditLogs()
      .then(setLogs)
      .catch((error) => setMessage(error instanceof Error ? error.message : "감사 로그 조회에 실패했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RequireAuth requireRole="ROLE_ADMIN">
      <div className="stack">
        <div className="section-header">
          <div>
            <h1>감사 로그</h1>
            <p>관리자 운영 작업 기록을 최신순으로 확인합니다.</p>
          </div>
        </div>

        <Message message={message} />

        {loading ? (
          <div className="alert">감사 로그를 불러오고 있습니다.</div>
        ) : logs.length === 0 ? (
          <div className="alert">감사 로그가 없습니다.</div>
        ) : (
          <div className="table-wrap admin-audit-logs-table-wrap">
            <table className="table admin-audit-logs-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>관리자 이메일</th>
                  <th>작업 유형</th>
                  <th>대상 유형</th>
                  <th>대상 ID</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.createdAt)}</td>
                    <td>{log.adminEmail}</td>
                    <td>
                      <span className="badge">{actionLabel(log.actionType)}</span>
                    </td>
                    <td>{targetLabel(log.targetType)}</td>
                    <td>{log.targetId}</td>
                    <td>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
