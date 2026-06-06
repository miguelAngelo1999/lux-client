import { Tag, TagTypeEnum } from "@/components/Core";
import { TRANSLATION_KEY } from "@/i18n/locales/key";
import { TableCellLayout } from "@fluentui/react-components";
import { type RuleDetailItem, RULE_POLICY } from "lux-js-sdk";
import React from "react";
import { useTranslation } from "react-i18next";

function RuleTag({ value }: Readonly<{ value: RuleDetailItem }>) {
  const { t } = useTranslation();

  if (value.policy === RULE_POLICY.Proxy) {
    return <TableCellLayout truncate><Tag type={TagTypeEnum.Info} value={t(TRANSLATION_KEY.PROXY)} /></TableCellLayout>;
  }
  if (value.policy === RULE_POLICY.Reject) {
    return <TableCellLayout truncate><Tag type={TagTypeEnum.Error} value={t(TRANSLATION_KEY.REJECT)} /></TableCellLayout>;
  }
  if (value.policy === RULE_POLICY.Direct) {
    return <TableCellLayout truncate><Tag type={TagTypeEnum.Warning} value={t(TRANSLATION_KEY.DIRECT)} /></TableCellLayout>;
  }
  // Named proxy policy (e.g. LP, Proxy2) — show in green with arrow
  return (
    <TableCellLayout truncate>
      <Tag type={TagTypeEnum.Success} value={'↗ ' + value.policy} />
    </TableCellLayout>
  );
}

export default RuleTag;
