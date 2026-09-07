# Jsonview

比 json.cn 更适合超大 JSON 的在线解析器：无广告、不上传、Worker 里解析、树和文本都用虚拟列表只画看得见的行。

json.cn 卡，通常不是 `JSON.parse` 慢，而是一次性把整棵树塞进 DOM。这里把解析和统计放到 Web Worker，界面只渲染可视行，所以 2 万条、几十万节点也能滚动。

## 本地运行

```bash
npm install
npm run dev
```

## 部署 Vercel

```bash
npx vercel
```

或导入这个仓库，框架选 Vite，无需环境变量。
