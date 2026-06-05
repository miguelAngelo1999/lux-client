import { getHttpSchema } from "@/components/Modal/Proxy/EditShadowsocksModal/validate";
import { TRANSLATION_KEY } from "@/i18n/locales/key";
import { proxiesSlice, type RootState } from "@/reducers";
import { Button } from "@fluentui/react-components";
import { addProxy, type Http, ProxyTypeEnum, updateProxy } from "lux-js-sdk";
import { lockProxyPassword } from "lux-js-sdk";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Field, Form, PasswordFiled } from "../../../Core";
import styles from "./index.module.css";

interface EditHttpModalProps {
  close: () => void;
  initialValue?: Http;
  isSelected?: boolean;
}

const INIT_DATA: Http = {
  type: ProxyTypeEnum.Http,
  server: "",
  id: "",
  name: "",
  port: 1080,
  password: "",
  username: "",
};

export function EditHttpModal(props: Readonly<EditHttpModalProps>) {
  const { t } = useTranslation();
  const [lockOnSave, setLockOnSave] = useState(false);
  const { close, initialValue, isSelected } = props;
  const dispatch = useDispatch();
  const isStarted = useSelector<RootState, boolean>(
    (state) => state.manager.isStared,
  );
  const onSubmit = async (data: Http) => {
    let savedId = data.id;
    if (initialValue) {
      await updateProxy({
        id: data.id,
        proxy: data,
      });
      dispatch(proxiesSlice.actions.updateOne({ proxy: data }));
    } else {
      const { id } = await addProxy({
        proxy: data,
      });
      savedId = id;
      dispatch(proxiesSlice.actions.addOne({ proxy: { ...data, id } }));
    }    if (lockOnSave && savedId) {
      try { await lockProxyPassword(savedId); } catch(e) {}
    }
    close();
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValue ?? INIT_DATA}
      validationSchema={getHttpSchema(t)}
    >
      {({ isValid, submitForm }) => {
        return (
          <>
            <Field<keyof Http>
              name="name"
              label={t(TRANSLATION_KEY.FORM_NAME)}
            />
            <Field<keyof Http>
              name="server"
              label={t(TRANSLATION_KEY.FORM_SERVER)}
            />
            <Field<keyof Http>
              name="port"
              label={t(TRANSLATION_KEY.FORM_PORT)}
              type="number"
            />
            <Field<keyof Http>
              name="username"
              label={`${t(TRANSLATION_KEY.FORM_USERNAME)}(${t(
                TRANSLATION_KEY.FORM_OPTIONAL,
              )})`}
            />
            <PasswordFiled<keyof Http>
              name="password"
              proxyId={initialValue?.id}
              label={`${t(TRANSLATION_KEY.FORM_PASSWORD)}(${t(
                TRANSLATION_KEY.FORM_OPTIONAL,
              )})`}
            />
                        <label style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"8px",cursor:"pointer"}}>
              <input type="checkbox" checked={lockOnSave} onChange={(e) => setLockOnSave(e.target.checked)} />
              <span style={{fontSize:"13px",color:"#e53e3e"}}>{t(TRANSLATION_KEY.LOCK_PASSWORD_ON_SAVE)}</span>
            </label>
            <div className={styles.buttonContainer}>
              <Button onClick={close} className={styles.button}>
                {t(TRANSLATION_KEY.FORM_CANCEL)}
              </Button>
              <Button
                className={styles.button}
                disabled={!isValid || (isSelected && isStarted)}
                onClick={submitForm}
                appearance="primary"
              >
                {t(TRANSLATION_KEY.FORM_SAVE)}
              </Button>
            </div>
          </>
        );
      }}
    </Form>
  );
}
