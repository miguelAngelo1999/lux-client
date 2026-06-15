export interface Rule {
  id: string;
  value: string;
}

export enum RULE_TYPE {
  Domain = "DOMAIN",
  IpCidr = "IP-CIDR",
  DomainKeyword = "DOMAIN-KEYWORD",
  DomainRegex = "DOMAIN-REGEX",
  DomainSuffix = "DOMAIN-SUFFIX",
  Process = "PROCESS",
  DnsMap = "DNS-MAP",
  DstPort = "DST-PORT",
  BuiltIn = "BUILD-IN",
}

export enum RULE_POLICY {
  Direct = "DIRECT",
  Proxy = "PROXY",
  Reject = "REJECT",
}

interface GetRulesRes {
  rules: Rule[];
  selectedId: string;
}
export type GetRules = () => Promise<GetRulesRes>;

export interface RuleDetailItem {
  policy: RULE_POLICY | string;  // string allows named proxy policies
  payload: string;
  ruleType: RULE_TYPE | string;
  raw?: string;       // raw rule string including # prefix for disabled rules
  disabled?: boolean; // true if rule is disabled (# prefixed)
  network?: string;   // optional protocol filter: "tcp" or "udp" (absent = both)
}

interface GetRuleDetailRes {
  items: RuleDetailItem[];
}
export type GetRuleDetail = (id: string) => Promise<GetRuleDetailRes>;

export type AddCustomizedRules = (rules: string[]) => Promise<void>;

export type DeleteCustomizedRules = (rules: string[]) => Promise<void>;

export type EditCustomizedRule = (
  oldRule: string,
  newRule: string,
) => Promise<void>;
