# 快速刷新 Fast Refresh

快速刷新（Fast Refresh）是 React 官方提供的热更新解决方案，让我们可以在对 React 组件进行修改时提供即时反馈。

例如在开发时，我们修改了组件的布局或样式后，浏览器界面自动更新为新的布局或样式，假设之前在界面的表单里已经填入了数据，那这些数据应该依然存在。

Joy 应用默认开启了快速刷新，大部分情况下，在 1 秒左右能看到更新后的结果。

> 本文描述的组件状态，指的是 React 组件内部状态 `state`。
>
> 而我们的业务数据状态通常应该存放在 `ReactModel` 中，得益于 [@symph/react](/react/start/introduce) 统一数据源的设计，在 Fast Refresh 过程中不受影响，因为 React 能够使用全局状态在任何时候重新渲染组件。

## 如何工作的

- 如果编辑了一个只导出 React 组件的文件，Fast Refresh 将只热更新该文件的代码，并重新渲染组件。您可以编辑该文件中的任何内容，包括样式、呈现逻辑、事件处理程序或效果。
- 如果编辑了一个非 React 组件导出的文件，Fast Refresh 会重新运行该文件，以及导入它的其他文件。因此，如果 `Button.js` 和 `Modal.js` 都导入了 `theme.js`，编辑 `theme.js` 将更新这两个组件。
- 最后，如果编辑了一个由非 React 树导入的文件，Fast Refresh 将降级到完全重新加载。例如有一个文件，它渲染了一个 React 组件，但也导出了一个常量，而一个非 React 模块导入了它。
  在这种情况下，想让快速刷新重新生效，可考虑将常量迁移到一个单独的文件，并将其导入到两个文件中。其它很多情况通常也可以用类似的方法解决。

## 错误恢复

### 语法错误

如果在开发过程中出现语法错误，在编译中会看到错误提示，可以修复它并再次保存文件，这个错误会自动消失。因此我们不需要重新加载应用，也不会丢失组件状态。

### 运行时错误

如果组件内部出现运行时错误，界面将出现错误提示浮层覆盖界面，修复错误后，这个浮层会自动消失，无需重新加载整个应用。

如果错误不是发生在组件渲染期间，错误修复后，组件的状态将会保留。但如果错误发现在组件渲染期间，React 将会使用更新后的代码重新加载应用。

如果应用程序中有 [错误边界](https://reactjs.org/docs/error-boundaries.html) (这对于生产中是处理错误的一个推荐方式)，出现错误后将在下次修改时尝试重新渲染边界内的组件。
这意味着错误边界可以防止错误上抛到应用根组件，重置整个应用状态。但是，要记住错误边界不应该太细，它们应该是为生产中特意设计和使用的。

## 保留状态局限性

在安全的情况下，Fast Refresh 试图在编辑组件后热更新组件时保留 React 组件的状态，但在以下是一些不安全的情况下，React 组件将重新挂载，状态不会被保留:

- React 类声明的组件，其内部状态不会被保留。只有使用函数组件和 Hooks 时，才会保留状态。
- 除了 React 组件之外，正在编辑的文件可能还有其他导出。
- 当导出的组件是一个高阶组件（HOC 如： WrappedComponent），且高阶组件返回的是一个类时。
- 匿名箭头函数，如 `export default () => <div />;`，也将导致状态重置。此时可考虑使用命名函数代替：`export default funciton MyComponent () { return <div />;}` 。

## 使用技巧

- 尽量将业务数据状态放在 ReactModel 中，它不受 Fast Refresh 的影响，能够更好的恢复业务场景。
- 默认情况下，函数式组件能够更好的支持 Fast Refresh，在更新的过程中保留组件状态。
- 有时，您可能希望强制重置状态，并重新安装组件。例如，如果你要调整一个只发生在挂载上的动画，这就很方便了。为此，我们可以通过在编辑的文件的任何位置添加 `// @refresh reset`注释， 指示 Fast Refresh 在每次编辑时重新挂载在该文件中定义的组件。
- 通过 Fast Refresh，我们可以在编辑的文件中添加 `console.log` 或者 `debug`来调试应用，不用重新加载应用来使打印日志生效。

## Fast Refresh 和 Hooks

在尽可能的情况下， Fast Refresh 尝试在两次编辑之间保存组件的状态。特别是，只要不更改它们的参数或 Hook 调用的顺序，`useState`和`useRef`就会保留它们以前的值。

带有依赖项的钩子（如`useEffect`、`useMemo`和`usecallback`）将始终在快速刷新期间更新。当快速刷新发生时，它们的依赖项列表将被忽略。
例如，当编辑`useMemo(() => x * 2， [x])`为`useMemo (() => x * 10， [x])`时，即使`x`(依赖项)没有改变，它也会重新运行。

有时，这可能会导致意想不到的结果。例如，即使一个带有空依赖数组的 `useEffect` 仍然会在快速刷新期间重新运行一次。

然而，即使没有快速刷新，编写能够适应偶尔重新运行 useEffect 的代码也是一个很好的实践。
它将使你更容易在以后引入新的依赖，并且它也是 React `Strict Mode`强制约束的，强烈建议启用它。
