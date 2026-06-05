import { Button } from "@fluentui/react-components";
import { EyeOffRegular, EyeRegular } from "@fluentui/react-icons";
import React, { useState, useRef } from "react";
import { useFormikContext } from "formik";
import axios from "axios";
import { urtConfig } from "lux-js-sdk/url";
import {
  Field as FluentInput,
  Input,
} from "@fluentui/react-components";
import { useField } from "formik";

type PasswordFiledProps = {
  name: string;
  label?: string;
  proxyId?: string;
  validate?: (value: string) => string;
  disabled?: boolean;
  className?: string;
};

export function PasswordFiled(props: Readonly<PasswordFiledProps>) {
  const { proxyId, name, label, validate, disabled, className } = props;
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [field, meta, helpers] = useField({ name, validate });

  const handleToggle = async () => {
    if (revealed) {
      setIsShowPassword(!isShowPassword);
      return;
    }

    if (proxyId) {
      setIsLoading(true);
      try {
        const username = window.prompt("Enter your Windows username to verify identity:");
        if (!username) { setIsLoading(false); return; }
        const pwd = window.prompt("Enter your Windows password:");
        if (!pwd) { setIsLoading(false); return; }
        const verifyRes = await axios.post(`${urtConfig.proxies}/verify-admin`, { username, password: pwd });
        if (!verifyRes.data.verified) {
          window.alert("Authentication failed");
          setIsLoading(false);
          return;
        }
        const revealRes = await axios.get(`${urtConfig.proxies}/${proxyId}/reveal`);
        if (revealRes.data.password) {
          helpers.setValue(revealRes.data.password);
          setIsShowPassword(true);
          setRevealed(true);
        } else {
          window.alert("Password is locked or empty");
        }
      } catch (e) {
        window.alert("Failed to reveal password");
      }
      setIsLoading(false);
    } else {
      setIsShowPassword(!isShowPassword);
    }
  };

  return (
    <FluentInput
      label={label}
      validationMessage={meta.error && meta.touched ? meta.error : null}
      className={className}
      spellCheck={false}
    >
      <Input
        name={field.name}
        value={field.value || ""}
        onChange={field.onChange}
        onBlur={field.onBlur}
        type={isShowPassword ? "text" : "password"}
        disabled={disabled}
        contentAfter={
          <Button
            onClick={handleToggle}
            appearance="transparent"
            size="small"
            disabled={isLoading}
            icon={isShowPassword ? <EyeRegular /> : <EyeOffRegular />}
          />
        }
      />
    </FluentInput>
  );
}