import { test } from "@e2e-dev/web";
import { chromium, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { reviewPages } from "../../apps/console/src/design/f-series/full/catalog";
const origin = "http://127.0.0.1:5790";
const base = "/__design/f-series/full";
const output = fileURLToPath(new URL("../../.e2e/artifacts/f-series-full/", import.meta.url));
async function select(p: Page, label: string, value: string) {
  const input = p.getByRole("combobox", { name: label, exact: true });
  const control = p.locator(`.el-select:has(input[aria-label="${label}"]) .el-select__wrapper`);
  await control.click();
  await expect(input).toHaveAttribute("aria-expanded", "true");
  const listId = await input.getAttribute("aria-controls");
  expect(listId).toBeTruthy();
  const list = p.locator(`[id="${listId}"]`);
  await expect(list).toHaveAttribute("role", "listbox");
  await list.getByRole("option", { name: value, exact: true }).click();
  await expect(list).toBeHidden();
}
async function check(p: Page, name: string, checked: boolean) {
  const input = p.getByRole("checkbox", { name, exact: true });
  if ((await input.isChecked()) !== checked)
    await p.locator("label.el-checkbox").filter({ has: input }).click();
  await expect(input).toBeChecked({ checked });
}
async function role(p: Page, value: string) {
  await select(p, "审阅角色", value);
}
async function reset(p: Page) {
  await p.goto(origin + base + "/identity");
  await p.getByRole("button", { name: "重置全部审阅样例", exact: true }).click();
}
async function confirm(p: Page) {
  await p.locator("[data-confirm-submit]").click();
  await expect(p.locator(".el-dialog")).toBeHidden();
}
async function shot(p: Page, name: string) {
  // Dismiss transient selectors through visible UI before visual capture.
  const dialog = p.locator(".el-dialog:visible .el-dialog__header");
  if (await dialog.count()) await dialog.first().click();
  else await p.locator(".full-review-boundary").click();
  await expect(p.locator(".el-select-dropdown:visible")).toHaveCount(0);
  await mkdir(output, { recursive: true });
  await p.screenshot({ path: output + name + ".png", fullPage: true });
}
async function owned(run: (p: Page) => Promise<void>) {
  const b = await chromium.launch();
  try {
    const c = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: "zh-CN" });
    c.setDefaultTimeout(8000);
    const p = await c.newPage();
    try {
      await run(p);
    } catch (error) {
      await mkdir(output, { recursive: true });
      await p.screenshot({
        path: output + "failure-" + new URL(p.url()).pathname.split("/").pop() + ".png",
        fullPage: true,
      });
      throw error;
    }
  } finally {
    await b.close();
  }
}
export function registerFullReviewTests() {
  for (const entry of reviewPages)
    test(`F-series full: ${entry.screen} ${entry.id} all declared states`, async () =>
      owned(async (p) => {
        await reset(p);
        const capability =
          entry.group === "platform"
            ? "平台管理员"
            : (["release", "operations"].includes(entry.group) &&
                  ["delivery", "qualification", "release", "rollout", "recovery"].includes(
                    entry.id,
                  )) ||
                entry.id === "telemetry"
              ? "获准运维人员"
              : entry.id === "diagnostics"
                ? "获准支持人员"
                : "企业负责人";
        await role(p, capability);
        await p.goto(origin + base + "/" + entry.id);
        for (const scene of entry.scenarios) {
          if (entry.id === "sessions" && scene.id !== "expired") await role(p, capability);
          await select(p, "审阅场景", scene.title[0]);
          await expect(p.locator("[data-page]")).toHaveAttribute("data-page", entry.id);
          await expect(p.locator("[data-scene]")).toHaveAttribute("data-scene", scene.id);
          await expect(p.getByRole("heading", { name: entry.title[0], exact: true })).toBeVisible();
          if (scene.id === "normal") await shot(p, entry.screen + "-" + entry.id + "-normal");
          if (scene.id !== "normal")
            await expect(p.locator("[data-scenario-feedback]")).toContainText(scene.help[0]);
          expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
            true,
          );
        }
        await shot(p, entry.screen + "-" + entry.id);
        const geometry = await p.evaluate(() => ({
          height: document.querySelector(".cl-global-header")!.getBoundingClientRect().height,
          x: document.querySelector(".cl-primary-rail")!.getBoundingClientRect().x,
        }));
        expect(geometry).toEqual({ height: 56, x: 0 });
      }));
  test("F-series full: unknown receipt reads immutable success after a later version change", async () =>
    owned(async (p) => {
      await reset(p);
      await p.goto(origin + base + "/customer-edit?target=C-1001&scene=unknown");
      await p
        .getByRole("textbox", { name: "客户服务备注", exact: true })
        .fill("第一笔已提交，首回执丢失");
      await p.getByRole("button", { name: "核对修改影响", exact: true }).click();
      await confirm(p);
      await expect(p.locator(".full-table tbody")).toContainText("结果待确认");
      const original = p.url();
      await p.getByRole("button", { name: "负责关系并发变化（审阅）", exact: true }).click();
      await p.getByRole("button", { name: "查询原操作结果", exact: true }).click();
      await expect(p.locator(".full-table tbody")).toContainText("已完成");
      await p.getByRole("button", { name: "返回原业务对象", exact: true }).click();
      await expect(p.locator(".full-card")).toContainText("第一笔已提交，首回执丢失");
      await expect(p.getByRole("button", { name: "修改客户", exact: true })).toBeDisabled();
      await p.goto(original);
      await p.getByRole("button", { name: "查询原操作结果", exact: true }).click();
      await expect(p.locator("[data-notice]")).toContainText("终态保留");
      await shot(p, "immutable-readback");
      await p.goto(origin + base + "/customer?target=DOES-NOT-EXIST");
      await expect(p.getByRole("heading", { name: "客户记录不可访问", exact: true })).toBeVisible();
      await expect(p.locator(".full-card")).not.toContainText("第一笔已提交");
    }));
  test("F-series full: linked invitation accepts once and enters actual membership", async () =>
    owned(async (p) => {
      await reset(p);
      await p.goto(origin + base + "/invitations");
      await p.getByRole("button", { name: "受邀者入口", exact: true }).first().click();
      await p.getByRole("button", { name: "验证受邀组织账号", exact: true }).click();
      await p.getByRole("button", { name: "核对并接受邀请", exact: true }).click();
      await confirm(p);
      await expect(p.locator(".full-table tbody")).toContainText("已完成");
      await p.getByRole("button", { name: "返回原业务对象", exact: true }).click();
      await expect(p.getByRole("heading", { name: "企业当前可用模块", exact: true })).toBeVisible();
      await p.goto(origin + base + "/invitation-accept?invite=INV-REVIEW-0");
      await expect(p.getByRole("button", { name: "核对并接受邀请", exact: true })).toBeDisabled();
      await shot(p, "accepted-invitation");
    }));
  test("F-series full: last Owner protection and per-action delegation fail closed", async () =>
    owned(async (p) => {
      await reset(p);
      await p.goto(origin + base + "/members");
      await p
        .locator('tr:has(td:text-is("陈予安"))')
        .getByRole("button", { name: "停用", exact: true })
        .click();
      await p.locator("[data-confirm-submit]").click();
      await expect(p.locator("[data-notice]")).toContainText("指定另一位在任企业负责人");
      await p.getByRole("button", { name: "取消", exact: true }).click();
      await p.goto(origin + base + "/role-edit?target=owner");
      await check(p, "允许当前范围内的成员与角色管理", false);
      await p.getByRole("button", { name: "核对权限变化", exact: true }).click();
      await p.locator("[data-confirm-submit]").click();
      await expect(p.locator("[data-notice]")).toContainText("必须保留成员管理与转交能力");
      await p.getByRole("button", { name: "取消", exact: true }).click();
      await p.goto(origin + base + "/role-edit?target=owner");
      await check(p, "允许当前范围内的成员与角色管理", true);
      await select(p, "客户修改范围", "无");
      await select(p, "客户导出范围", "无");
      await select(p, "营销执行范围", "无");
      await p.getByRole("button", { name: "核对权限变化", exact: true }).click();
      await confirm(p);
      await p.goto(origin + base + "/invite-create");
      await p
        .getByRole("textbox", { name: "批量邀请地址", exact: true })
        .fill("bounded@example.test");
      await select(p, "邀请角色", "业务成员");
      await p.getByRole("button", { name: "解析并核对地址", exact: true }).click();
      await p.getByRole("button", { name: "核对最终邀请范围", exact: true }).click();
      await p.locator("[data-confirm-submit]").click();
      await expect(p.locator("[data-notice]")).toContainText("超出逐动作委派范围");
      await shot(p, "delegation-denied");
    }));
  test("F-series full: platform nomination does not confer creator membership", async () =>
    owned(async (p) => {
      await reset(p);
      await role(p, "平台管理员");
      await p.goto(origin + base + "/tenant-create");
      await p.getByRole("textbox", { name: "企业名称", exact: true }).fill("新园区审阅企业");
      await p.getByRole("textbox", { name: "企业唯一标识", exact: true }).fill("new-review");
      await p
        .getByRole("textbox", { name: "负责人受控测试地址", exact: true })
        .fill("nominated@example.test");
      await p.getByRole("button", { name: "核对创建信息", exact: true }).click();
      await confirm(p);
      await p.getByRole("button", { name: "返回原业务对象", exact: true }).click();
      await expect(p.locator("tbody")).toContainText("等待受邀负责人验证");
      await role(p, "企业负责人");
      await p.goto(origin + base + "/organizations");
      await expect(p.locator(".full-review")).not.toContainText("新园区审阅企业");
      await shot(p, "platform-no-auto-membership");
      await p.clock.install({ time: new Date() });
      await p.clock.setFixedTime(new Date(Date.now() + 73 * 3600_000));
      await role(p, "平台管理员");
      await p.goto(origin + base + "/tenant?target=tenant-new-review");
      await p
        .getByRole("textbox", { name: "重新指定负责人地址", exact: true })
        .fill("renewed-owner@example.test");
      await p.getByRole("button", { name: "核对重新指定负责人", exact: true }).click();
      await confirm(p);
      await p.goto(origin + base + "/tenant?target=tenant-new-review");
      await p.getByRole("button", { name: "审阅受邀负责人验证入口", exact: true }).click();
      await p.getByRole("button", { name: "验证受邀组织账号", exact: true }).click();
      await p.getByRole("button", { name: "核对并接受邀请", exact: true }).click();
      await confirm(p);
      await p.getByRole("button", { name: "返回原业务对象", exact: true }).click();
      await expect(p.locator(".full-review")).toContainText("新园区审阅企业");
      await expect(p.getByRole("button", { name: "进入模块", exact: true }).first()).toBeDisabled();
    }));
  test("F-series full: natural expiry can be reissued while preserving the retired invitation", async () =>
    owned(async (p) => {
      await reset(p);
      await p.clock.install({ time: new Date() });
      await p.clock.setFixedTime(new Date(Date.now() + 73 * 3600_000));
      await p.goto(origin + base + "/invitations");
      await p.getByRole("button", { name: "核对重新邀请", exact: true }).first().click();
      await confirm(p);
      await p.getByRole("button", { name: "返回原业务对象", exact: true }).click();
      await p.goto(origin + base + "/invitations");
      await expect(p.locator("tbody")).toContainText("已过期");
      await expect(p.locator("tbody tr")).toHaveCount(2);
      await shot(p, "natural-expiry-reissue");
    }));
  test("F-series full: function without Menu can activate and return from denied Console deep link", async () =>
    owned(async (p) => {
      await reset(p);
      await role(p, "业务成员");
      await p.goto(origin + base + "/campaign?target=M-1001&scene=unknown");
      await p.getByRole("button", { name: "核对并启动活动", exact: true }).click();
      await confirm(p);
      const original = p.url();
      await p.getByRole("button", { name: "查询原操作结果", exact: true }).click();
      await expect(p.locator(".full-table tbody")).toContainText("已完成");
      await p.getByRole("button", { name: "返回原业务对象", exact: true }).click();
      await expect(p.getByRole("button", { name: "核对并启动活动", exact: true })).toBeDisabled();
      await p.getByRole("button", { name: "核对后台深链拒绝", exact: true }).click();
      await expect(
        p.getByRole("heading", { name: "暂时无法访问此页面", exact: true }),
      ).toBeVisible();
      await p.getByRole("button", { name: "返回工作空间", exact: true }).click();
      await expect(p.locator("[data-page]")).toHaveAttribute("data-page", "campaign");
      await p.goto(original);
      await expect(p.locator(".full-table tbody")).toContainText("已完成");
      await shot(p, "function-without-menu");
    }));
  test("F-series full: export rechecks ownership and module access before download", async () =>
    owned(async (p) => {
      await reset(p);
      await p.goto(origin + base + "/customers");
      await check(p, "选定客户 C-1001", true);
      await check(p, "选定客户 C-1002", true);
      await p.getByRole("button", { name: "导出选定集合", exact: true }).click();
      await p.getByRole("button", { name: "排除不可导出项目", exact: true }).click();
      await p.getByRole("button", { name: "核对并创建导出记录", exact: true }).click();
      await confirm(p);
      const original = p.url();
      const file = p.waitForEvent("download");
      await p.getByRole("button", { name: "按当前权限下载文件", exact: true }).click();
      expect((await file).suggestedFilename()).toMatch(/^review-customers-/);
      await p.getByRole("button", { name: "负责关系并发变化（审阅）", exact: true }).click();
      await p.getByRole("button", { name: "按当前权限下载文件", exact: true }).click();
      await expect(p.locator("[data-notice]")).toContainText("导出范围已变化");
      await role(p, "平台管理员");
      await p.goto(origin + base + "/module-grant?target=qinghe");
      await select(p, "模块生效方式", "关闭模块");
      await check(p, "客户管理", true);
      await p.getByRole("button", { name: "核对开通影响", exact: true }).click();
      await confirm(p);
      await role(p, "企业负责人");
      await p.goto(original);
      await expect(
        p.getByRole("heading", { name: "没有可读取的原操作", exact: true }),
      ).toBeVisible();
      await shot(p, "export-current-access");
    }));
  test("F-series full: pasted selection resolves ambiguity and retains partial original results", async () =>
    owned(async (p) => {
      await reset(p);
      await p.goto(origin + base + "/batch?scene=partial");
      await p
        .getByRole("textbox", { name: "批量客户输入", exact: true })
        .fill(["C-1001", "C-1003", "C-1006", "星河中心", "C-1001", "UNMATCHED"].join("\n"));
      await p.getByRole("button", { name: "匹配并核对范围", exact: true }).click();
      await expect(p.locator(".full-table")).toContainText("需要精确选择");
      await expect(
        p.getByRole("button", { name: "核对选定集合与影响", exact: true }),
      ).toBeDisabled();
      await p.getByRole("button", { name: "排除无法处理项目", exact: true }).click();
      await p.getByRole("button", { name: "核对选定集合与影响", exact: true }).click();
      await confirm(p);
      await expect(p.locator(".full-table tbody tr")).toHaveCount(3);
      await expect(p.locator(".full-table")).toContainText("结果待确认");
      await p.getByRole("button", { name: "查询此项原结果", exact: true }).click();
      await expect(p.locator(".full-table")).toContainText("未完成");
      await p.getByRole("button", { name: "仅核对明确失败项目", exact: true }).click();
      await expect(p.getByRole("textbox", { name: "批量客户输入", exact: true })).toHaveValue(
        "C-1003",
      );
      await shot(p, "partial-original-results");
    }));
  test("F-series full: desktop languages and dark theme keep canonical geometry", async () =>
    owned(async (p) => {
      await reset(p);
      await p.goto(origin + base + "/customers");
      await p.getByRole("button", { name: "语言", exact: true }).click();
      await p.getByText("English", { exact: true }).click();
      await expect(p.getByRole("heading", { name: "Customers", exact: true })).toBeVisible();
      await p.getByRole("button", { name: "Use dark appearance", exact: true }).click();
      await expect(p.locator("html")).toHaveClass(/dark/);
      const palette = await p.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return {
          surface: style.getPropertyValue("--color-surface").trim(),
          text: style.getPropertyValue("--color-text").trim(),
        };
      });
      const rgb = (hex: string) => {
        if (!/^#[0-9a-f]{6}$/i.test(hex)) throw Error("Expected canonical hex palette");
        return `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
      };
      const control = p.locator(".full-review-tools .el-select__wrapper").first();
      await expect(control).toHaveCSS("background-color", rgb(palette.surface));
      await expect(control.locator(".el-select__placeholder")).toHaveCSS(
        "color",
        rgb(palette.text),
      );
      const contrast = await p.evaluate(() => {
        const wrapper = document.querySelector(".full-review-tools .el-select__wrapper")!;
        const text = wrapper.querySelector(".el-select__placeholder")!;
        const luminance = (color: string) => {
          const v = color
            .match(/[0-9.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((x) => {
              const n = x / 255;
              return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
            });
          return v[0]! * 0.2126 + v[1]! * 0.7152 + v[2]! * 0.0722;
        };
        const foreground = luminance(getComputedStyle(text).color);
        const background = luminance(getComputedStyle(wrapper).backgroundColor);
        return (
          (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
        );
      });
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      for (const [width, height] of [
        [1366, 768],
        [1440, 900],
        [1536, 1024],
      ]) {
        await p.setViewportSize({ width: width!, height: height! });
        expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await shot(p, `english-dark-${width}`);
      }
    }));
  test("F-series full: real tabs isolate late reads, tenant results and shared logout", async () => {
    const b = await chromium.launch();
    try {
      const c = await b.newContext({ viewport: { width: 1366, height: 768 }, locale: "zh-CN" });
      const a = await c.newPage();
      const z = await c.newPage();
      await reset(a);
      await z.goto(origin + base + "/customers");
      await z.getByRole("button", { name: "使用当前审阅身份", exact: true }).click();
      await role(z, "企业负责人");
      await a.goto(origin + base + "/customers");
      await a.getByRole("button", { name: "挂起读取（审阅）", exact: true }).click();
      await a.locator(".cs-tenant-select .el-select__wrapper").click();
      await a.getByRole("option", { name: "云岚生活", exact: true }).click();
      await a.getByRole("button", { name: "交付旧响应（审阅）", exact: true }).click();
      await expect(a.locator("[data-notice]")).toContainText("旧响应已丢弃");
      await expect(z.locator(".full-table tbody")).toContainText("青禾科技园");
      await expect(a.locator(".full-table tbody")).toContainText("云岚运营中心");
      for (const page of [a, z]) {
        await page.goto(origin + base + "/campaign?target=M-1001&scene=unknown");
        await page.getByRole("button", { name: "核对并启动活动", exact: true }).click();
        await confirm(page);
        await expect(page.locator(".full-table tbody")).toContainText("结果待确认");
      }
      const originalA = a.url();
      const originalB = z.url();
      expect(originalA).not.toBe(originalB);
      for (const page of [a, z]) {
        await page.reload();
        await expect(page.locator(".full-table tbody")).toContainText("结果待确认");
      }
      await z.getByRole("button", { name: "查询原操作结果", exact: true }).click();
      await expect(z.locator(".full-table tbody")).toContainText("已完成");
      await expect(a.locator(".full-table tbody")).toContainText("结果待确认");
      await z.goto(origin + base + "/sessions");
      await z
        .locator('[data-page="sessions"]')
        .getByRole("button", { name: "退出当前浏览器", exact: true })
        .click();
      await z.getByRole("button", { name: "确认撤销", exact: true }).click();
      await expect(a.getByRole("heading", { name: "当前访问受到限制", exact: true })).toBeVisible();
      await shot(a, "two-tabs-logout");
    } finally {
      await b.close();
    }
  });
}
