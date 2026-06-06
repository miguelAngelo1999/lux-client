import { Table } from "@/components/Core";
import { AddRuleModal } from "@/components/Modal/AddRuleModal";
import RuleCell from "@/components/pages/Data/Connections/RuleTag";
import { useDangerStyles } from "@/hooks";
import { TRANSLATION_KEY } from "@/i18n/locales/key";
import { CUSTOMIZED_RULE_ID } from "@/utils/constants";
import {
  Button,
  createTableColumn,
  SearchBox,
  TableCellLayout,
  Tooltip,
} from "@fluentui/react-components";
import { AddFilled, ArrowUpRegular, ArrowDownRegular, DeleteRegular, EditRegular, EyeOffRegular, EyeRegular } from "@fluentui/react-icons";
import { type TableColumnDefinition } from "@fluentui/react-table";
import { t } from "i18next";
import {
  addCustomizedRules,
  deleteCustomizedRules,
  editCustomizedRule,
  getRuleDetail,
  reorderCustomizedRules,
  toggleCustomizedRule,
  type RuleDetailItem,
} from "lux-js-sdk";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./index.module.css";

interface RuleTableProps {
  id: string;
}

function calcTableHeight() {
  return document.documentElement.clientHeight - 48 - 68 - 44 - 32 - 16;
}

function formatRule(rule: RuleDetailItem) {
  return `${rule.ruleType.trim()},${rule.payload.trim()},${rule.policy.trim()}`;
}

export default function RuleTable(props: Readonly<RuleTableProps>) {
  const { id } = props;

  const [rules, setRules] = useState<RuleDetailItem[]>([]);

  const [searchedValue, setSearchedValue] = useState("");

  const [editingRule, setEditingRule] = useState<RuleDetailItem | undefined>();

  const [isAddingRule, setIsAddingRule] = useState(false);

  const inlineStyles = useDangerStyles();

  const refresh = useCallback(async () => {
    if (id) {
      getRuleDetail(id).then((res) => {
        setRules(res.items || []);
      });
    }
  }, [id]);

  useEffect(() => {
    refresh().catch((e) => {
      console.log(e);
    });
  }, [refresh]);

  const handleDeleteCustomizedRule = useCallback(
    async (rule: RuleDetailItem) => {
      await deleteCustomizedRules([formatRule(rule)]);
      await refresh();
    },
    [refresh],
  );

  const handleEditCustomizedRule = useCallback(
    async (rule: RuleDetailItem) => {
      setEditingRule(rule);
      setIsAddingRule(true);
      await refresh();
    },
    [refresh],
  );

  const handleAddRule = useCallback(
    async (value: RuleDetailItem) => {
      const newRule = formatRule(value);
      if (editingRule) {
        const oldRule = formatRule(editingRule);
        await editCustomizedRule(oldRule, newRule);
      } else {
        await addCustomizedRules([newRule]);
      }
      await refresh();
    },
    [editingRule, refresh],
  );

  const handleMoveRule = useCallback(
    async (rule: RuleDetailItem, direction: "up" | "down") => {
      // Use raw or formatted string to find index (indexOf fails with object refs)
      const ruleStr = (rule as any).raw || formatRule(rule);
      const idx = rules.findIndex(r => ((r as any).raw || formatRule(r)) === ruleStr);
      if (idx === -1) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === rules.length - 1) return;
      const newRules = [...rules];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newRules[idx], newRules[swapIdx]] = [newRules[swapIdx], newRules[idx]];
      // Preserve disabled state by using raw field
      await reorderCustomizedRules(newRules.map(r => (r as any).raw || formatRule(r)));
      await refresh();
    },
    [rules, refresh],
  );

  const data = useMemo(() => {
    return rules.filter((conn) => {
      if (searchedValue) {
        return [conn.payload, conn.policy, conn.ruleType].some((value) => {
          return value
            .toLocaleLowerCase()
            .includes(searchedValue.toLocaleLowerCase());
        });
      }
      return true;
    });
  }, [rules, searchedValue]);

  const handleEdit = useCallback(
    (item: RuleDetailItem) => {
      handleEditCustomizedRule(item).catch((e) => {
        console.log(e);
      });
    },
    [handleEditCustomizedRule],
  );

  const handleToggleRule = useCallback(
    async (item: RuleDetailItem) => {
      // Send the raw rule string (with or without # prefix)
      const rawRule = (item as any).raw || `${item.ruleType},${item.payload},${item.policy}`;
      await toggleCustomizedRule(rawRule);
      await refresh();
    },
    [refresh],
  );

  const handleDelete = useCallback(
    (item: RuleDetailItem) => {
      handleDeleteCustomizedRule(item).catch((e) => {
        console.log(e);
      });
    },
    [handleDeleteCustomizedRule],
  );

  const columns = useMemo<Array<TableColumnDefinition<RuleDetailItem>>>(() => {
    return [
      createTableColumn<RuleDetailItem>({
        columnId: "ruleType",
        renderHeaderCell: () => {
          return t(TRANSLATION_KEY.TYPE);
        },
        renderCell: (item) => {
          return <TableCellLayout truncate>{item.ruleType}</TableCellLayout>;
        },
      }),
      createTableColumn<RuleDetailItem>({
        columnId: "payload",
        renderHeaderCell: () => {
          return t(TRANSLATION_KEY.PAYLOAD);
        },
        renderCell: (item) => {
          return (
            <TableCellLayout truncate>
              <span style={(item as any).disabled ? { textDecoration: "line-through", opacity: 0.5 } : undefined}>
                {item.payload}
              </span>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<RuleDetailItem>({
        columnId: "policy",
        renderHeaderCell: () => {
          return t(TRANSLATION_KEY.POLICY);
        },
        renderCell: (item) => {
          return <RuleCell value={item} />;
        },
      }),
      id === CUSTOMIZED_RULE_ID
        ? createTableColumn<RuleDetailItem>({
            columnId: "action",
            renderHeaderCell: () => {
              return "";
            },
            renderCell: (item) => {
              return (
                <TableCellLayout truncate>
                  <div className={styles.actionBtns}>
                    <Button
                      icon={<ArrowUpRegular />}
                      onClick={() => handleMoveRule(item, "up")}
                      size="small"
                      title="Move up"
                    />
                    <Button
                      icon={<ArrowDownRegular />}
                      onClick={() => handleMoveRule(item, "down")}
                      size="small"
                      title="Move down"
                    />
                    <Button
                      icon={(item as any).disabled ? <EyeRegular /> : <EyeOffRegular />}
                      onClick={() => handleToggleRule(item)}
                      size="small"
                      title={(item as any).disabled ? "Enable rule" : "Disable rule"}
                      style={{ opacity: 0.7 }}
                    />
                    <Button
                      icon={<EditRegular />}
                      onClick={() => handleEdit(item)}
                    />
                    <Button
                      icon={<DeleteRegular className={inlineStyles.danger} />}
                      onClick={() => handleDelete(item)}
                    />
                  </div>
                </TableCellLayout>
              );
            },
          })
        : null,
    ].filter(Boolean) as Array<TableColumnDefinition<RuleDetailItem>>;
  }, [handleDelete, handleEdit, handleToggleRule, id, inlineStyles.danger]);

  const [tableHeight, setTableHeight] = useState(calcTableHeight());

  const onResize = useCallback(() => {
    setTableHeight(calcTableHeight());
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);

  return (
    <div className={styles.wrapper}>
      {isAddingRule && (
        <AddRuleModal
          initValue={editingRule}
          close={() => {
            setIsAddingRule(false);
          }}
          onSave={handleAddRule}
        />
      )}
      <div className={styles.toolbar}>
        <SearchBox
          value={searchedValue}
          onChange={(_, data) => {
            setSearchedValue(data.value);
          }}
          placeholder={t(TRANSLATION_KEY.SEARCH_RULE_TIP)}
          className={styles.input}
          spellCheck={false}
        />
        <div className={styles.actions}>
          {id === CUSTOMIZED_RULE_ID && (
            <Tooltip
              content={t(TRANSLATION_KEY.ADD_RULE)}
              relationship="description"
            >
              <Button
                onClick={() => {
                  setIsAddingRule(true);
                  setEditingRule(undefined);
                }}
                className={styles.closeAll}
                icon={<AddFilled />}
              />
            </Tooltip>
          )}
        </div>
      </div>
      <Table columns={columns} data={data} sortable height={tableHeight} />
    </div>
  );
}
