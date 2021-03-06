# 自定义 App

Joy 使用`App`来包装和初始化整个界面，我们可以自定它来控制页面的初始化，例如：

- 添加所有页面共有的布局。
- 捕获渲染错误，使用`componentDidCatch`。
- 修改路由或者路由的渲染方式。
- 添加全局样式。

## _app.tsx 文件

下面我们开始覆盖默认的`App`， 首选创建文件`./src/pages/_app.tsx`，修改其内容：

```tsx
import React from "react";
import { IReactApplication, ReactRouterService, RouteSwitch } from "@symph/react";
import { ReactAppProps } from "@symph/joy";

export default class App extends React.Component<ReactAppProps, any> {
  protected reactRouterService: ReactRouterService;
  constructor(props: ReactAppProps, context?: any) {
    super(props, context);
    const appContext = props.appContext;
    this.reactRouterService = appContext.getSync<ReactRouterService>("reactRouterService");
  }
  render() {
    const routes = this.reactRouterService.getRoutes() || [];
    return <RouteSwitch routes={routes} extraProps={{}} />;
  }
}
```

`App` 的`props`中包含了`IReactApplication`实例，我们可以通过它获取到整个 React 应用的业务组件，例如上面例子中的`reactRouterService`路由组件。
`render()`中使用的`RouteSwitch`组件来渲染应用中注册的路由，包括文件约定路由。

## 注意事项：

- 如果你的应用正在开发模式下运行中，首次添加`./src/pages/_app.js`文件，需要重新启动开发服务器。
- `App`在服务端和浏览器上都会被渲染，所以需要注意渲染环境差异，例如在服务端渲染时，不能使用浏览器特有的API。
