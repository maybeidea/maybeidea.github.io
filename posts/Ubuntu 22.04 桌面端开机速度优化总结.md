---
title: Ubuntu 22.04 桌面端开机速度优化总结
date: 2026-5.9
category: linux
tags:
  - 折腾日志
  - Linux
  - ubuntu
featuredFormula:
publish: true
---

在 启动自家战队的 nuc 的时候发现 ubuntu 22.04开机速度实在太慢，遂上网搜索了解决方法

# 1. 当前启动耗时分析

运行
```bash
systemd-analyze
systemd-analyze blame | head -30
systemd-analyze critical-chain
```

运行 `systemd-analyze` 我们得到以下结果：

```text
Startup finished in 17.400s (firmware) + 2.186s (loader) + 2.705s (kernel) + 28.349s (userspace) = 50.642s
graphical.target reached after 28.326s in userspace
```

其中，含义如下：

| 阶段        | 含义                     |     当前耗时 | 优化方向                           |
| --------- | ---------------------- | -------: | ------------------------------ |
| firmware  | BIOS / UEFI 硬件自检、寻找启动盘 | 17.400 s | BIOS 开 Fast Boot、关闭 PXE/USB 启动 |
| loader    | GRUB 加载阶段              |  2.186 s | 缩短 GRUB 等待                     |
| kernel    | Linux 内核启动、加载驱动        |  2.705 s | 通常不需要重点优化                      |
| userspace | Ubuntu 服务、网络、桌面登录界面启动  | 28.349 s | 优化 systemd 服务、Plymouth、网络等待    |

再运行 `systemd-analyze blame | head -30`,得知(这里仅列举前十项)

```text
20.690s plymouth-quit-wait.service 
6.087s NetworkManager-wait-online.service
1.516s snapd.seeded.service 
1.452s snapd.service 
415ms fwupd.service 
400ms logrotate.service 
358ms systemd-binfmt.service 
335ms apparmor.service 
325ms proc-sys-fs-binfmt_misc.mount 
288ms rpcbind.service 
```

但是要注意一点：`blame` 里的时间 **不是简单相加**，因为很多服务是并行启动的。它主要用于找“单个服务启动用了多久”，真正影响总启动时间还要结合 `systemd-analyze critical-chain`，这里从略

## **plymouth-quit-wait.service** 是什么

> **plymouth-quit-wait.service** 属于 **Plymouth** 系统的一部分，Plymouth 是一个提供漂亮启动界面的项目，主要用于在 Linux 启动时显示图形动画或进度条。它依赖 **KMS（Kernel Mode Setting）** 或 EFI 帧缓冲来尽早设置显示器分辨率，并在启动过程中显示启动画面，直到系统准备好显示登录界面。

可见 `plymouth-quit-wait.service ` 并非真正的瓶颈，不过关闭 Plymouth 可以减少启动动画/黑屏等待，不会有什么影响且方便排查，倒也可以顺手一关(实际上也可以省掉加载图形动画的时间)。

编辑 GRUB：

```bash
sudo gedit /etc/default/grub
```

找到：

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
```

改为：

```bash
GRUB_CMDLINE_LINUX_DEFAULT="quiet noplymouth"
```

更新 GRUB 并重启：

```bash
sudo update-grub
sudo reboot
```

---

# 2. 优先优化项一：关闭网络等待

NetworkManager-wait-online 是一个 **systemd 服务**，用于确保网络完全配置并上线后，才允许依赖网络的其他服务启动，桌面端 Ubuntu 通常不需要等待网络完全在线后再进入系统。

执行：

```bash
sudo systemctl disable NetworkManager-wait-online.service
```

如果重启后它仍然出现，可以进一步执行：

```bash
sudo systemctl mask NetworkManager-wait-online.service
```
强力禁用该启动项 ，确保其他项也不能唤起它

恢复方法：

```bash
sudo systemctl unmask NetworkManager-wait-online.service
sudo systemctl enable NetworkManager-wait-online.service
```

注意：如果 NUC 开机后需要自动挂载 NAS、NFS、Samba 网络盘，或者某些服务必须等网络可用后启动，不建议直接 mask。

其他的各种 `service` 同样的处理方法

## 可选：关闭其他不用的桌面服务

这些服务耗时不算大，但不用的话可以关闭，减少后台负担。
查看已启用服务：

```bash
systemctl list-unit-files --state=enabled
```

可选关闭：

```bash
sudo systemctl disable bluetooth.service
sudo systemctl disable cups.service
sudo systemctl disable avahi-daemon.service
sudo systemctl disable ModemManager.service
```

含义：

| 服务           | 什么时候可以关闭                       |
| ------------ | ------------------------------ |
| bluetooth    | 不使用蓝牙                          |
| cups         | 不使用打印机                         |
| avahi-daemon | 不需要局域网发现、`.local` 主机名、AirPrint |
| ModemManager | 不使用 4 G / 5 G 蜂窝网卡             |

不建议为了节省一两百毫秒关闭 `firewalld.service`，因为它是防火墙相关服务。

---

# 3. 优先优化项三：优化 BIOS / UEFI 阶段

当前 `firmware` 阶段耗时 17.400 秒，说明 BIOS / UEFI 自检偏慢。这一段不是 Ubuntu 控制的，主要在 BIOS 中优化。

开机按进入 BIOS，打开 `Fast Boot`

> **Fast Boot** 会直接调用上次关机时保存的硬件信息，跳过部分非必要硬件的初始化（如 U 盘、光驱、网卡启动等），也不等待某些设备的响应(如键盘初始化等待阶段，导致不容易进入 BIOS)。

保存退出。

## 如何再次进入 bios

命令行输入
```bash
systemctl reboot --firmware-setup
```

---

# 4. 缩短 GRUB 等待时间

编辑 GRUB：

```bash
sudo gedit /etc/default/grub
```

修改

```bash
GRUB_TIMEOUT_STYLE=hidden
GRUB_TIMEOUT=0
```

**没有 GRUB 选单**（直接启动）

修改后执行：

```bash
sudo update-grub
```

---

# 5. Snap 相关优化

当前 Snap 相关服务耗时：

```text
1.516s snapd.seeded.service
1.452s snapd.service
```

如果不用某些 Snap 应用，可以删除。

查看 Snap 应用：

```bash
snap list
```

删除不用的 Snap：

```bash
#彻底删除snapd和配置文件    
sudo apt purge snapd    
#不要用autoremove！否则很多依赖也都会被删除
#sudo apt autoremove --purge snapd
```
