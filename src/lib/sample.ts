export const SAMPLE_JSON = `{
  "name": "Jsonview",
  "why": "json.cn 卡在整棵 DOM 树上。这里用 Worker 解析 + 虚拟列表，只渲染看得见的行。",
  "features": [
    "无广告",
    "本地解析，数据不上传",
    "树形折叠 / 文本视图",
    "复制路径和值",
    "搜索 key 与字符串"
  ],
  "nested": {
    "user": {
      "id": 42,
      "email": "demo@jsonview.app",
      "roles": ["admin", "editor"],
      "active": true
    },
    "metrics": {
      "latencyMs": 12,
      "ok": null
    }
  }
}
`;
