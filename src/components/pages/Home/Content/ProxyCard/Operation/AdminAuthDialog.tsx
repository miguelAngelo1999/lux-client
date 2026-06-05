import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
  Label,
  Spinner,
} from "@fluentui/react-components";
import { LockClosedRegular } from "@fluentui/react-icons";
import axios from "axios";

interface AdminAuthDialogProps {
  open: boolean;
  onDismiss: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function AdminAuthDialog({
  open,
  onDismiss,
  onVerified,
  title = "Verify Identity",
  description = "Enter your system password to continue.",
}: AdminAuthDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError("");

    try {
      // Use window.location.origin to hit the same server the dashboard is served from
      const origin = window.location.origin;
      const res = await axios.post(`${origin}/auth/verify-password`, { password });

      if (res.data?.verified) {
        setPassword("");
        onVerified();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Verification failed. Please try again.");
      }
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open && !loading) onDismiss(); }}>
      <DialogSurface>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle>
              <LockClosedRegular style={{ marginRight: 8 }} />
              {title}
            </DialogTitle>
            <DialogContent>
              <p style={{ marginBottom: 12 }}>{description}</p>
              <Label htmlFor="admin-password">System Password</Label>
              <Input
                id="admin-password"
                ref={inputRef}
                type="password"
                value={password}
                onChange={(_, data) => { setPassword(data.value); setError(""); }}
                style={{ width: "100%", marginTop: 4 }}
                autoComplete="off"
                disabled={loading}
              />
              {error && (
                <p style={{ color: "red", marginTop: 8, fontSize: 13 }}>{error}</p>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={onDismiss} disabled={loading}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={!password || loading}
                icon={loading ? <Spinner size="tiny" /> : undefined}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
