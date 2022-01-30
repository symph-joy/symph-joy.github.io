import React, { ReactNode } from "react";
import { BaseReactController, ReactController, RouteParam } from "@symph/react";
import { Outlet } from "@symph/react/router-dom";
import { DocMenuItem, DocsModel } from "../../model/docs.model";
import { Affix, Menu, Drawer } from "antd";
import styles from "./docs.less";
import { MenuUnfoldOutlined } from "@ant-design/icons";
import { Inject } from "@symph/core";

@ReactController()
export default class DocsLayout extends BaseReactController {
  @RouteParam({ name: "path" })
  docPath: string;

  @Inject()
  public docsModel: DocsModel;

  state = {
    showDrawer: false,
    openKeys: null,
  };

  private async showDoc(menu: DocMenuItem) {
    this.props.navigate(`${menu.path}`);
  }

  async initModelStaticState(): Promise<void | number> {
    const tem = this.props.location.pathname.split("/");
    let path = [tem[0], tem[1]].join("/") || "/docs";
    await this.docsModel.getDocMenus(path);
  }

  private renderMenuItem(items: DocMenuItem[] | undefined) {
    if (!items || items.length === 0) {
      return undefined;
    }
    const views = [];
    for (const item of items) {
      const { children, title, path } = item;
      if (children) {
        views.push(
          <Menu.SubMenu key={path} title={title}>
            {this.renderMenuItem(children)}
          </Menu.SubMenu>
        );
      } else {
        views.push(
          <Menu.Item key={path} onClick={this.showDoc.bind(this, item)}>
            {title}
          </Menu.Item>
        );
      }
    }
    return views;
  }

  onOpenChange = (openKeys) => {
    this.setState({
      openKeys: openKeys,
    });
  };

  renderView(): ReactNode {
    const { docMenus, defaultOpenKeys, currentDoc } = this.docsModel.state;
    return (
      <div className={styles.layoutContent}>
        <Affix>
          <Menu
            selectedKeys={[currentDoc?.path]}
            mode="inline"
            openKeys={this.state.openKeys || defaultOpenKeys}
            className={styles.docMenus}
            onOpenChange={this.onOpenChange}
          >
            {this.renderMenuItem(docMenus)}
          </Menu>
        </Affix>
        <div
          className={styles.menuIcon}
          onClick={() => {
            this.setState({
              showDrawer: true,
            });
          }}
        >
          <MenuUnfoldOutlined />
        </div>
        <Drawer
          placement="left"
          onClose={() => {
            this.setState({
              showDrawer: false,
            });
          }}
          visible={this.state.showDrawer}
        >
          <Menu selectedKeys={[currentDoc?.path]} mode="inline" openKeys={defaultOpenKeys} style={{ height: "calc(100vh - 64px)" }}>
            {this.renderMenuItem(docMenus)}
          </Menu>
        </Drawer>
        <Outlet />
      </div>
    );
  }
}