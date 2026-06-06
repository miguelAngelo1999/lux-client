import { TRANSLATION_KEY } from "@/i18n/locales/key";
import { type RootState } from "@/reducers";
import { notifier } from "@/components/Core";
import React, { type ReactNode, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

export function ElevateModal(): ReactNode {
  const { t } = useTranslation();
  const shown = useRef(false);

  const isAdmin = useSelector<RootState, boolean>(
    (state) => state.general.isAdmin,
  );

  const mode = useSelector<RootState, string>(
    (state) => state.setting?.mode || "system",
  );

  useEffect(() => {
    if (!isAdmin && !shown.current && (mode === "tun" || mode === "mixed")) {
      shown.current = true;
      notifier.warn(t(TRANSLATION_KEY.ELEVATE_CORE));
    }
  }, [isAdmin, mode, t]);

  return null;
}