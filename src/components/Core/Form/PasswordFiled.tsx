import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Input, Label, Spinner } from "@fluentui/react-components";
import { EyeOffRegular, EyeRegular, LockClosedRegular } from "@fluentui/react-icons";
import React, { useState, useRef, useEffect } from "react";
import { getProxyDetail } from "lux-js-sdk";
import axios from "axios";
import {
  Field as FluentInput,
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
  const [authOpen, setAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const authInputRef = useRef<HTMLInputElement>(null);
  const [field, meta, helpers] = useField({ name, validate });

  useEffect(() => {
    if (authOpen) {
      setAuthPassword("");
      setAuthError("");
      setTimeout(() => authInputRef.current?.focus(), 100);
    }
  }, [authOpen]);

  const handleToggle = async () => {
    if (revealed) {
      setIsShowPassword(!isShowPassword);
      return;
    }
    if (proxyId) {
      setAuthOpen(true);
    } else {
      setIsShowPassword(!isShowPassword);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPassword) return;

    setAuthLoading(true);
    setAuthError("");

    try {
      const origin = window.location.origin;
      const res = await axios.post(`${origin}/auth/verify-password`, { password: authPassword });

      if (res.data?.verified) {
        setAuthOpen(false);
        setAuthPassword("");
        // Now fetch the actual password
        setIsLoading(true);
        try {
          const detail = await getProxyDetail(proxyId!);
          if (detail.password) {
            helpers.setValue(detail.password);
            setIsShowPassword(true);
            setRevealed(true);
          } else {
            window.alert("Password is locked or empty");
          }
        } catch {
          window.alert("Failed to retrieve password");
        }
        setIsLoading(false);
      } else {
        setAuthError("Incorrect password. Please try again.");
        setAuthPassword("");
        setTimeout(() => authInputRef.current?.focus(), 100);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setAuthError("Incorrect password. Please try again.");
      } else {
        setAuthError("Verification failed. Please try again.");
      }
      setAuthPassword("");
      setTimeout(() => authInputRef.current?.focus(), 100);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <>
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
      <Dialog open={authOpen} onOpenChange={(_, data) => { if (!data.open && !authLoading) setAuthOpen(false); }}>
        <DialogSurface>
          <form onSubmit={handleAuthSubmit}>
            <DialogBody>
              <DialogTitle>
                <LockClosedRegular style={{ marginRight: 8 }} />
                Verify Identity
              </DialogTitle>
              <DialogContent>
                <p style={{ marginBottom: 12 }}>Enter your system password to reveal the proxy password.</p>
                <Label htmlFor="field-auth-pwd">System Password</Label>
                <Input
                  id="field-auth-pwd"
                  ref={authInputRef}
                  type="password"
                  value={authPassword}
                  onChange={(_, data) => { setAuthPassword(data.value); setAuthError(""); }}
                  style={{ width: "100%", marginTop: 4 }}
                  autoComplete="off"
                  disabled={authLoading}
                />
                {authError && (
                  <p style={{ color: "red", marginTop: 8, fontSize: 13 }}>{authError}</p>
                )}
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setAuthOpen(false)} disabled={authLoading}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={!authPassword || authLoading}
                  icon={authLoading ? <Spinner size="tiny" /> : undefined}
                >
                  {authLoading ? "Verifying..." : "Verify"}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </>
  );
}
