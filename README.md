## 1.搭建开发环境

### 1.1 创建项目

```js
mkdir react18.2-debugger
cd react18.2-debugger
npm init -y
```

### 1.2 安装

```js
npm install vite @vitejs/plugin-react --save-dev
```

### 1.3 下载 React18.2 源码

- [github 地址](https://github.com/facebook/react/tree/v18.2.0)
- 下载后拷贝以下目录到项目目录中
  - src\react\packages\react
  - src\react\packages\react-dom
  - src\react\packages\react-dom-bindings
  - src\react\packages\react-reconciler
  - src\react\packages\scheduler
  - src\react\packages\shared

![](https://static.zhufengpeixun.com/copyproject_1654073226092.png)

### 1.4 把 flow 文件改为 js 文件

```js
npm install strip-flowtype -g
strip-flowtype src/react/packages/**/*.js
```

### 1.5 删除`__tests__`目录(非必要)

- src\react\packages\react\src\_\_tests\_\_
- src\react\packages\react-dom\src\_\_tests\_\_
- src\react\packages\react-dom-bindings\src\_\_tests\_\_
- src\react\packages\react-reconciler\src\_\_tests\_\_
- src\react\packages\scheduler\src\_\_tests\_\_
- src\react\packages\shared\_\_tests\_\_

## 2.修改配置

### 2.1 配置 HostConfig

src\react\packages\react-reconciler\src\ReactFiberHostConfig.js

```diff
- throw new Error('This module must be shimmed by a specific renderer.');
+ export * from './forks/ReactFiberHostConfig.dom';
```

### 2.2 修改 ReactSharedInternals.js

src\react\packages\shared\ReactSharedInternals.js

```diff
-const ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
+import ReactSharedInternals from '../react/src/ReactSharedInternals';
+export default ReactSharedInternals;
```

### 2.3 ReactServerContext.js

src\react\packages\react\src\ReactServerContext.js

```diff
+const ContextRegistry = ReactSharedInternals?.ContextRegistry;
```

### 2.4 ReactComponentStackFrame.js

```js
Uncaught TypeError: Cannot destructure property 'ReactCurrentDispatcher' of 'ReactSharedInternals_default' as it is undefined.
    at ReactComponentStackFrame.js:14:3
```

src\react\packages\shared\ReactComponentStackFrame.js

```diff
+//import ReactSharedInternals from 'shared/ReactSharedInternals';
+//const {ReactCurrentDispatcher } = ReactSharedInternals;

  if (__DEV__) {
+//   previousDispatcher = ReactCurrentDispatcher.current; // Set the dispatcher in DEV because this might be call in the render function for warnings.

+//   ReactCurrentDispatcher.current = null;
    disableLogs();
  }
    if (__DEV__) {
+//    ReactCurrentDispatcher.current = previousDispatcher;
      reenableLogs();
    }
```

### 2.5 checkPropTypes.js

src\react\packages\shared\checkPropTypes.js

```diff
+//const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {
  if (__DEV__) {
    if (element) {
      const owner = element._owner;
      const stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
+//     ReactDebugCurrentFrame.setExtraStackFrame(stack);
    } else {
+//     ReactDebugCurrentFrame.setExtraStackFrame(null);
    }
  }
}
```

## 3. 使用

### 3.1 vite.config.js

vite.config.js

```js
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
export default defineConfig({
  define: {
    __DEV__: true,
    __PROFILE__: true,
    __UMD__: true,
    __EXPERIMENTAL__: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      react: path.resolve(__dirname, "src/react/packages/react"),
      "react-dom": path.resolve(__dirname, "src/react/packages/react-dom"),
      "react-dom-bindings": path.posix.resolve(
        "src/react/packages/react-dom-bindings"
      ),
      "react-reconciler": path.resolve(
        __dirname,
        "src/react/packages/react-reconciler"
      ),
      scheduler: path.resolve(__dirname, "src/react/packages/scheduler"),
      shared: path.resolve(__dirname, "src/react/packages/shared"),
    },
  },
  plugins: [react()],
  optimizeDeps: {
    force: true,
  },
})
```

### 3.2 jsconfig.json

jsconfig.json

```js
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "react/*": ["src/react/*"],
      "react-dom/*": ["src/react-dom/*"],
      "react-reconciler/*": ["src/react-reconciler/*"],
      "scheduler/*": ["scheduler/*"],
      "shared/*": ["src/shared/*"],
      "react-dom-bindings/*": ["src/react-dom-bindings/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}

```

### 3.3 src\main.jsx

src\main.jsx

```js
import { createRoot } from "react-dom/client"
createRoot(document.getElementById("root")).render("hello")
```

### 3.4 index.html

index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 3.5 package.json

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

### 3.6 启动

```js
npm run dev
```
