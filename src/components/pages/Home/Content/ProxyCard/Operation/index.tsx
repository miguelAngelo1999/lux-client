import axios from "axios";
import { urtConfig } from "lux-js-sdk/url";
import { type MenuItemProps, notifier } from "@/components/Core";
import { useDangerStyles, useTestDelay } from "@/hooks";
import { proxiesSlice, type RootState, selectedSlice } from "@/reducers";
import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import {
  ClipboardRegular,
  DeleteRegular,
  DeviceEqRegular,
  EditRegular,
  MoreHorizontalFilled,
  QrCodeFilled,
  SendRegular,
} from "@fluentui/react-icons";
import { LockClosedRegular, EyeRegular } from "@fluentui/react-icons";
import {
  type BaseProxy,
  deleteProxies,
  ProxyTypeEnum,
  type Shadowsocks,
  updateSelectedProxyId,
} from "lux-js-sdk";
import { lockProxyPassword, getProxyDetail } from "lux-js-sdk";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { TRANSLATION_KEY } from "@/i18n/locales/key";
import { useTestUdp } from "@/utils/testUdp";
import { encode } from "@/utils/url";

interface OperationProps {
  proxy: BaseProxy;
  onEdit: (proxy: BaseProxy) => void;
  onShowQrCode: (proxy: BaseProxy) => void;
}

enum OperationTypeEnum {
  Edit = "edit",
  Delete = "delete",
  CopyUrl = "copyUrl",
  Test = "test",
  QrCode = "qrCode",
  TestUdp = "testUdp",
  LockPassword = "lockPassword",
  RevealPassword = "revealPassword",
  UnlockPassword = "unlockPassword",
}

export function Operation(props: Readonly<OperationProps>): React.ReactNode {
  const { t } = useTranslation();
  const { proxy, onEdit, onShowQrCode } = props;
  const { id: proxyId } = proxy;

  const inlineStyles = useDangerStyles();

  const dispatch = useDispatch();
  const testDelay = useTestDelay();
  const testUdp = useTestUdp();
  const isStarted = useSelector<RootState, boolean>(
    (state) => state.manager.isStared,
  );
  const isSwitchLoading = useSelector<RootState, boolean>(
    (state) => state.manager.isLoading,
  );
  const isSelected = useSelector<RootState, boolean>(
    (state) => state.selected.proxy === proxyId,
  );
  const menuItems: MenuItemProps[] = useMemo(() => {
    let items: MenuItemProps[] = [
      {
        id: OperationTypeEnum.Test,
        content: t(TRANSLATION_KEY.CONNECTIVITY_TEST),
        icon: <DeviceEqRegular />,
      },
      {
        id: OperationTypeEnum.TestUdp,
        content: t(TRANSLATION_KEY.COMMON_TEST_UDP),
        icon: <SendRegular />,
      },
      {
        id: OperationTypeEnum.RevealPassword,
        content: t(TRANSLATION_KEY.REVEAL_PASSWORD),
        icon: <EyeRegular />,
      },
      {
        id: OperationTypeEnum.LockPassword,
        content: t(TRANSLATION_KEY.LOCK_PASSWORD),
        icon: <LockClosedRegular />,
        isDanger: true,
      },
      {
        id: OperationTypeEnum.UnlockPassword,
        content: "Reset Lock",
        icon: <LockClosedRegular />,
      },
      {
        id: OperationTypeEnum.Delete,
        content: t(TRANSLATION_KEY.COMMON_DELETE),
        icon: <DeleteRegular />,
        disabled: (isStarted || isSwitchLoading) && isSelected,
        isDanger: true,
        isDivider: true,
      },
    ];
    if (
      ![
        ProxyTypeEnum.Shadowsocks as BaseProxy["type"],
        ProxyTypeEnum.Http,
        ProxyTypeEnum.Socks5,
      ].includes(proxy.type)
    ) {
      return items;
    }
    items = [
      {
        id: OperationTypeEnum.Edit,
        content: t(TRANSLATION_KEY.COMMON_EDIT),
        icon: <EditRegular />,
      },
      ...items,
    ];
    if (proxy.type === ProxyTypeEnum.Shadowsocks) {
      items = [
        {
          id: OperationTypeEnum.CopyUrl,
          content: t(TRANSLATION_KEY.COMMON_COPY_URL),
          icon: <ClipboardRegular />,
        },
        {
          id: OperationTypeEnum.QrCode,
          content: t(TRANSLATION_KEY.COMMON_QR_CODE),
          icon: <QrCodeFilled />,
        },
        ...items,
      ];
    }
    return items;
  }, [isSelected, isStarted, isSwitchLoading, proxy.type, t]);
  const onSelect = async (id: string) => {
    switch (id) {
      case OperationTypeEnum.Edit:
        onEdit(proxy);
        return;
      case OperationTypeEnum.Delete: {
        await deleteProxies({ ids: [proxy.id] });
        dispatch(proxiesSlice.actions.deleteOne({ id: proxyId }));
        if (isSelected) {
          await updateSelectedProxyId({ id: "" });
          dispatch(selectedSlice.actions.setProxy({ id: "" }));
        }
        notifier.success(t(TRANSLATION_KEY.DELETED));
        return;
      }
      case OperationTypeEnum.Test: {
        await testDelay(proxyId);
        return;
      }
      case OperationTypeEnum.TestUdp: {
        await testUdp(proxyId);
        return;
      }
      case OperationTypeEnum.CopyUrl: {
        const url = encode(proxy as Shadowsocks);
        await navigator.clipboard.writeText(url);
        notifier.success(t(TRANSLATION_KEY.COPIED));
        return;
      }
      case OperationTypeEnum.QrCode: {
        onShowQrCode(proxy);
        return;
      }
      case OperationTypeEnum.UnlockPassword: {
        const unlockUser = window.prompt("Enter your Windows username to verify identity:");
        if (!unlockUser) return;
        const unlockPass = window.prompt("Enter your Windows password:");
        if (!unlockPass) return;
        const unlockVerify = await axios.post(`${urtConfig.proxies}/verify-admin`, { username: unlockUser, password: unlockPass });
        if (!unlockVerify.data.verified) {
          notifier.error("Authentication failed");
          return;
        }
        const newPass = window.prompt("Enter the new proxy password:");
        if (!newPass) return;
        await axios.post(`${urtConfig.proxies}/${proxy.id}/unlock-password`, { password: newPass });
        notifier.success("Password lock removed");
        return;
      }
      case OperationTypeEnum.LockPassword: {
        if (window.confirm(t(TRANSLATION_KEY.LOCK_PASSWORD_CONFIRM))) {
          await lockProxyPassword(proxy.id);
          notifier.success(t(TRANSLATION_KEY.LOCK_PASSWORD));
        }
        return;
      }
      case OperationTypeEnum.RevealPassword: {
        try {
          const username = window.prompt("Enter your Windows username to verify identity:");
          if (!username) return;
          const password = window.prompt("Enter your Windows password:");
          if (!password) return;
          const verifyRes = await axios.post(`${urtConfig.proxies}/verify-admin`, { username, password });
          if (!verifyRes.data.verified) {
            notifier.error("Authentication failed");
            return;
          }
          const revealRes = await axios.get(`${urtConfig.proxies}/${proxy.id}/reveal`);
          if (revealRes.data.password === "") {
            notifier.error("No password or password is locked");
          } else {
            window.prompt(t(TRANSLATION_KEY.REVEAL_PASSWORD), revealRes.data.password);
          }
        } catch (e) {
          notifier.error("Failed to verify or get password");
        }
        return;
      }
      default: {
        throw new Error(`invalid ${id}`);
      }
    }
  };

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button
          as={"a"}
          appearance="transparent"
          icon={<MoreHorizontalFilled />}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {menuItems.map((item) => (
            <MenuItem
              className={item.isDanger ? inlineStyles.danger : ""}
              disabled={item.disabled}
              key={item.id}
              icon={item.icon}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSelect(item.id as string);
              }}
            >
              {item.content}
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}
