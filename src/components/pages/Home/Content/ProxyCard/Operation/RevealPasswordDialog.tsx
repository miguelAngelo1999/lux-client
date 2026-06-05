import React, { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Input,
} from "@fluentui/react-components";
import { CopyRegular, EyeRegular, EyeOffRegular } from "@fluentui/react-icons";

interface RevealPasswordDialogProps {
  open: boolean;
  onDismiss: () => void;
  password: string;
}

export function RevealPasswordDialog({
  open,
  onDismiss,
  password,
}: RevealPasswordDialogProps) {
  const [visible, setVisible] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) { onDismiss(); setVisible(false); } }}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Proxy Password</DialogTitle>
          <DialogContent>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <Input
                type={visible ? "text" : "password"}
                value={password}
                readOnly
                style={{ flex: 1, fontFamily: "monospace" }}
              />
              <Button
                appearance="transparent"
                icon={visible ? <EyeOffRegular /> : <EyeRegular />}
                onClick={() => setVisible(!visible)}
                title={visible ? "Hide" : "Show"}
              />
              <Button
                appearance="transparent"
                icon={<CopyRegular />}
                onClick={handleCopy}
                title="Copy to clipboard"
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="primary" onClick={() => { onDismiss(); setVisible(false); }}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
