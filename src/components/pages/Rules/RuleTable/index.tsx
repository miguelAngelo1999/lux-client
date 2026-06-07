import { Table } from "@/components/Core";
import { DraggableRow } from "./DraggableRow";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
      const key = formatRule(rule);
      // Optimistic: remove immediately
      setRules(prev => prev.filter(r => formatRule(r) !== key));
      // Sync with server in background
      deleteCustomizedRules([key]).catch(() => refresh());
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
        // Optimistic: replace in local state
        setRules(prev => prev.map(r => formatRule(r) === oldRule ? value : r));
        editCustomizedRule(oldRule, newRule).catch(() => refresh());
      } else {
        // Optimistic: append
        setRules(prev => [...prev, value]);
        addCustomizedRules([newRule]).catch(() => refresh());
      }
    },
    [editingRule, refresh],
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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = rules.findIndex(r => formatRule(r) === active.id);
      const newIdx = rules.findIndex(r => formatRule(r) === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const newRules = [...rules];
      const [moved] = newRules.splice(oldIdx, 1);
      newRules.splice(newIdx, 0, moved);
      // Optimistic: update state immediately
      setRules(newRules);
      // Sync with server in background
      reorderCustomizedRules(newRules.map(r => (r as any).raw || formatRule(r))).catch(() => refresh());
    },
    [rules, refresh],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleEdit = useCallback(
    (item: RuleDetailItem) => {
      handleEditCustomizedRule(item).catch((e) => {
        console.log(e);
      });
    },
    [handleEditCustomizedRule],
  );

  const handleMoveRule = useCallback(
    (rule: RuleDetailItem, direction: "up" | "down") => {
      const ruleStr = formatRule(rule);
      const idx = rules.findIndex(r => formatRule(r) === ruleStr);
      if (idx === -1) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === rules.length - 1) return;
      const snapshot = rules;
      const newRules = [...rules];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newRules[idx], newRules[swapIdx]] = [newRules[swapIdx], newRules[idx]];
      setRules(newRules); // instant UI update
      reorderCustomizedRules(newRules.map(r => (r as any).raw || formatRule(r))).catch(() => {
        setRules(snapshot);
        notifier.error("Failed to reorder rules");
      });
    },
    [rules],
  );

  const handleToggleRule = useCallback(
    (item: RuleDetailItem) => {
      const key = formatRule(item);
      const fullItem = rules.find(r => formatRule(r) === key);
      const isDisabled = (fullItem as any)?.disabled === true;
      const rawRule = (fullItem as any)?.raw || key;
      // Optimistic: flip disabled flag immediately
      setRules(prev => prev.map(r => {
        if (formatRule(r) === key) {
          return { ...r, disabled: !isDisabled, raw: isDisabled ? key : "#" + key } as any;
        }
        return r;
      }));
      // Sync in background
      toggleCustomizedRule(rawRule).catch(() => refresh());
    },
    [rules, refresh],
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
                      icon={(data.find(r => formatRule(r) === formatRule(item)) as any)?.disabled ? <EyeRegular /> : <EyeOffRegular />}
                      onClick={() => handleToggleRule(item)}
                      size="small"
                      title={(data.find(r => formatRule(r) === formatRule(item)) as any)?.disabled ? "Enable rule" : "Disable rule"}
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
      {id === CUSTOMIZED_RULE_ID ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.map(r => formatRule(r))} strategy={verticalListSortingStrategy}>
            <div style={{ overflowY: "auto", height: tableHeight, width: "100%" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", padding: "4px 0", borderBottom: "2px solid var(--colorNeutralStroke1)", fontWeight: 600, fontSize: 12, color: "var(--colorNeutralForeground2)" }}>
                <div style={{ width: 36, flexShrink: 0 }} />
                <div style={{ width: 110, flexShrink: 0 }}>Type</div>
                <div style={{ flex: 1 }}>Payload</div>
                <div style={{ width: 100, flexShrink: 0 }}>Policy</div>
                <div style={{ width: 120, flexShrink: 0 }}>Actions</div>
              </div>
              {data.map((item) => {
                const fullItem = data.find(r => formatRule(r) === formatRule(item));
                const isDisabled = (fullItem as any)?.disabled === true;
                return (
                  <DraggableRow
                    key={formatRule(item)}
                    item={item}
                    isDisabled={isDisabled}
                    onToggle={() => handleToggleRule(item)}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Table columns={columns} data={data} sortable height={tableHeight} />
      )}
    </div>
  );
}
