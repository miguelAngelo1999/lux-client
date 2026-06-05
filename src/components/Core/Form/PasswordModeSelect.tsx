import React from "react";
import {
  Select,
  Label,
  Input,
} from "@fluentui/react-components";
import { useField } from "formik";
import { useTranslation } from "react-i18next";
import { TRANSLATION_KEY } from "@/i18n/locales/key";

interface PasswordModeSelectProps {
  modeName: string;
  ttlName: string;
}

export function PasswordModeSelect({ modeName, ttlName }: PasswordModeSelectProps) {
  const { t } = useTranslation();
  const [modeField, , modeHelpers] = useField(modeName);
  const [ttlField, , ttlHelpers] = useField(ttlName);

  return (
    <div style={{ marginTop: 8 }}>
      <Label>{t(TRANSLATION_KEY.PASSWORD_MODE)}</Label>
      <Select
        value={modeField.value || "persistent"}
        onChange={(_, data) => modeHelpers.setValue(data.value)}
        style={{ width: "100%", marginTop: 4 }}
      >
        <option value="persistent">{t(TRANSLATION_KEY.PASSWORD_MODE_PERSISTENT)}</option>
        <option value="one-time">{t(TRANSLATION_KEY.PASSWORD_MODE_ONETIME)}</option>
        <option value="timed">{t(TRANSLATION_KEY.PASSWORD_MODE_TIMED)}</option>
      </Select>

      {modeField.value === "timed" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <Label>{t(TRANSLATION_KEY.PASSWORD_TTL)}</Label>
          <Input
            type="number"
            value={ttlField.value || ""}
            onChange={(_, data) => ttlHelpers.setValue(Number(data.value) || 0)}
            style={{ width: 80 }}
            min={1}
          />
          <span style={{ fontSize: 13 }}>{t(TRANSLATION_KEY.PASSWORD_TTL_MINUTES)}</span>
        </div>
      )}
    </div>
  );
}
