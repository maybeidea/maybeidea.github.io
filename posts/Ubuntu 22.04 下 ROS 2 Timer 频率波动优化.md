---
title: Ubuntu 22.04 下 ROS 2 Timer 频率波动优化
date: 2026-5-8
category: linux
tags:
  - Linux
  - ubuntu
  - ROS2
featuredFormula:
publish: true
---

通过 gpt 的帮助解决问题并做好这篇总结，一来通过总结学到了很多东西，二来方便在其他 nuc 或机器上复刻这次调优的成果，三来也是在调优在未来出问题时方便排查和回溯

# 问题背景

在 Ubuntu 22.04 下，`rclcpp::Timer` 的定时回调会受到 Linux 调度器、ROS 2 Executor、其他回调阻塞、CPU 降频、中断、DDS 通信、相机和识别负载等因素影响。

所以普通 ROS 2 timer 只能做到低抖动，不能保证硬实时。

---

# 安装 linux-lowlatency

Ubuntu 22.04 非 Pro 情况下，最省事的做法是使用 `linux-lowlatency-hwe-22.04`。

查看当前内核：

```bash
uname -r
```

安装 HWE lowlatency：

```bash
sudo apt update
sudo apt install linux-lowlatency-hwe-22.04
sudo reboot
```

重启后检查：

```bash
uname -r
grep PREEMPT /boot/config-$(uname -r)
```

期望看到类似：

```text
xxx-lowlatency
CONFIG_PREEMPT=y
# CONFIG_PREEMPT_RT is not set
```

说明当前是 lowlatency 内核，不是完整 RT 内核。

> [!notes]
HWE 是 Hardware Enablement（硬件增强）的缩写，也叫「硬件使能内核」。它是专为 Ubuntu LTS 用户设计的一种定期内核升级机制，主要目的是让老系统也能支持最新的硬件，比如新 CPU、GPU、外设驱动等
> 
从 Ubuntu 20.04.1 LTS 开始，后续 LTS 版本的桌面版（Desktop）默认启用 HWE 内核，以支持最新硬件。
> 
> GA 是 General Availability（通用可用性）的缩写，是 Ubuntu LTS 的「原装稳定内核」。它的特点是追求长期稳定可靠，不寻求新硬件支持，主要是修复安全漏洞和关键 Bug，非常适合企业/服务器场景。

> [!notes]
> lowlatency Lowlatency 内核的主要特点是优化了中断处理、调度优先级以及系统内存的分配，最大限度地减少了延迟。

PREEMPT_RT 对非pro用户要手动编译且会有一些可能的bug,暂不采用

---

# 配置实时调度权限

如果：

```bash
ulimit -r
```

输出是：

```text
0
```

说明普通用户没有实时调度权限。这样代码里调用：

```cpp
pthread_setschedparam(..., SCHED_FIFO, ...)
```

会失败。

配置：

```bash
sudo groupadd -f realtime
sudo usermod -aG realtime $USER

sudo tee /etc/security/limits.d/99-realtime.conf > /dev/null <<EOF
@realtime soft rtprio 99
@realtime hard rtprio 99
@realtime soft memlock unlimited
@realtime hard memlock unlimited
@realtime soft priority 99
@realtime hard priority 99
EOF
```

检查 PAM limits：

```bash
grep pam_limits /etc/pam.d/common-session
grep pam_limits /etc/pam.d/common-session-noninteractive
```

如果没有输出，在对应文件中加入：

```text
session required pam_limits.so
```

重启：

```bash
sudo reboot
```

重新登录后检查：

```bash
ulimit -r
ulimit -l
groups
```

期望：

```text
ulimit -r -> 99
ulimit -l -> unlimited
groups    -> 包含 realtime
```

测试：

```bash
chrt -f 80 sleep 1
```

如果没有报错，说明普通用户可以使用 `SCHED_FIFO`。

注意：代码已经做了降级处理。即使某台 NUC 没配好实时权限，`planning_trajectory` 也不会直接退出，只会打印 warning，然后继续普通调度运行。

---

# cyclictest 验证系统延迟

安装：

```bash
sudo apt install rt-tests stress-ng
```

空载测试：

```bash
sudo cyclictest --mlockall --smp --priority=80 --interval=1000 --duration=10m
```

带压力测试：

```bash
stress-ng --cpu 8 --io 4 --vm 2 --vm-bytes 512M --timeout 10m
```

另一个终端运行：

```bash
sudo cyclictest --mlockall --smp --priority=80 --interval=1000 --duration=10m
```

重点看每个 CPU 的 `Max`。

之前测试里 CPU 7 的结果最好，所以默认把 trajectory 放到 CPU 7。  
如果其他 NUC 的 CPU 7 不好，或者核心数量不同，就把 `rt.cpu` 改成对应机器上最稳的核。

> [!notes] 
> - --mlockall: 锁定当前和未来的内存分配，防止被换出到 swap。
> - --smp: 对称多处理，测试每个 CPU 核心的延迟，即多核模式。
> - --priority=80: 设置实时线程的优先级为 80（可能属于 FIFO 或 RR 策略，cyclictest 默认使用 FIFO，优先级数值越高优先级越高，但 Linux 实时优先级范围 1-99，80 为较高优先级）。
> - --interval=1000: 基准间隔时间，单位微秒，即每 1000 us（1 ms）进行一次循环测试。
> - --duration=10 m: 测试运行时长，10 分钟。

> [!notes]
> - --cpu 8: 启动 8 个 CPU 压力工作线程，执行各种 CPU 密集型操作。
> - --io 4: 启动 4 个 I/O 压力工作线程，执行 sync, read, write 等操作，产生 I/O 负载。
> - --vm 2: 启动 2 个虚拟内存压力工作线程，通过分配和填充内存，并可能进行内存读写等操作。
> - --vm-bytes 512 M: 每个 vm 工作线程分配 512 MB 内存大小，总计 2*512 M=1 GB。
> - --timeout 10 m: 运行 10 分钟后停止。

---

# 设置 CPU governor 为 performance

安装：

```bash
sudo apt install linux-tools-common linux-tools-$(uname -r)
```

设置：

```bash
sudo cpupower frequency-set -g performance
```

检查：

```bash
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

期望全部为：

```text
performance
```

`performance` 会尽量让 CPU 保持高频，减少动态降频/升频带来的延迟抖动，这里的重点是保持频率而不是提高频率，实际上这里的性能提高对自瞄的帮助不大反而会加速耗电。

---

# CPU 隔离

以 8 核 NUC 为例，推荐这样分：

```text
CPU0-3:
  系统
  桌面
  中断
  后台任务

CPU4-6:
  vision_container

CPU7:
  trajectory_container / traj_rt_loop
```

编辑 grub：

```bash
sudo gedit /etc/default/grub
```

把：

```text
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
```

改成：

```text
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash isolcpus=4-7 nohz_full=4-7 rcu_nocbs=4-7 irqaffinity=0-3"
```

更新并重启：

```bash
sudo update-grub
sudo reboot
```

检查：

```bash
cat /proc/cmdline
cat /sys/devices/system/cpu/isolated
```

期望看到：

```text
4-7
```

如果某台 NUC 不是 8 核，不要照抄 `4-7`，要按实际核心数改。

---

# 代码里的改动

主要优化有三

- 任务绑定 cpu (taskset -c 7 就是绑到 CPU 7)
- planning_trajectory 独立实时线程
- 清理原码中的高频日志和调整 qos 策略

## launch 中的修改

这里注意不要把所有组件放在一个 `component_container` 里。

原因是 Linux 只能按进程绑核。  
如果 camera、detector、tracker、trajectory 都在同一个 container 里，就没法单独把 trajectory 放到 CPU 7。

不要在 launch 里强制 chrt：

```bash
chrt -f 80 taskset -c 7
```

原因是不同 NUC 不一定都配好了 `ulimit -r = 99`，也不一定都有 CPU 7。  
如果在 launch 里强制 `chrt`，某台机器没配好就会直接启动失败。

推荐做法：

```text
launch:
  只做安全 taskset
  CPU 列表有效 -> 绑定
  CPU 列表无效 -> 自动跳过

planning_trajectory 代码内部:
  独立线程自己尝试 SCHED_FIFO
  成功就实时运行
  失败就 warning 并降级运行
```

## planning_trajectory 独立实时线程

原来的 ROS 2 timer 路径是：

```text
timer 到期
-> executor wait set 被唤醒
-> executor 选择 callback
-> callback group 调度
-> timer_callback
```

这中间只要 executor 里还有 DDS、TF、参数、订阅回调，就可能影响 timer 的触发稳定性。

所以最终把 trajectory 的周期触发从 ROS 2 timer 里拿出来，改成节点内部独立线程：

```text
traj_rt_loop
-> clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME)
-> RtLoopOnce()
-> AutoSolveTrajectory
-> publish /trajectory/send
```

### 线程启动和停止

#### StartRtThread

```cpp
void PlanningTrajectoryNode::StartRtThread()
{
  if (rt_running_.load())
  {
    return;
  }

  rt_running_.store(true);
  rt_thread_ = std::thread(&PlanningTrajectoryNode::RtLoop, this);
}
```

作用：

```text
如果实时线程没启动，就启动一个 std::thread
线程入口是 this->RtLoop()
```

`rt_running_` 是 `std::atomic_bool`，用于跨线程安全控制线程启停。

#### StopRtThread

```cpp
void PlanningTrajectoryNode::StopRtThread()
{
  rt_running_.store(false);

  if (rt_thread_.joinable())
  {
    rt_thread_.join();
  }
}
```

作用：

```text
把 rt_running_ 置 false
等待 RtLoop() 退出
防止节点析构后线程还在访问已经销毁的对象
```

### 判断 CPU 是否存在

```cpp
bool PlanningTrajectoryNode::IsCpuAvailable(int cpu) const
{
  if (cpu < 0)
  {
    return false;
  }

  const long online_cpu_count = sysconf(_SC_NPROCESSORS_ONLN); // 查询当前在线 CPU 数量
  return online_cpu_count > 0 && cpu < online_cpu_count;
}
```

比如 8 核机器返回 8，合法 CPU 编号是：

```text
0 1 2 3 4 5 6 7
```

### 当前线程实时化

```cpp
bool PlanningTrajectoryNode::ConfigureCurrentThreadRealtime()
```

这个函数只配置当前线程，也就是 `traj_rt_loop`，不是整个 ROS 进程。

它做两件事：

```text
1. pthread_setaffinity_np:
   尝试把 traj_rt_loop 绑定到 rt.cpu

2. pthread_setschedparam:
   尝试把 traj_rt_loop 设置成 SCHED_FIFO + rt.priority
```

### RtLoop 主循环

`RtLoop()` 是实时线程主函数。

启动后先做：

```text
1. 设置线程名 traj_rt_loop
2. 尝试 mlockall
3. 尝试 CPU affinity
4. 尝试 SCHED_FIFO
5. 初始化 next_time
```

然后进入循环：

```cpp
while (rclcpp::ok() && rt_running_.load())
{
  AddNs(next_time, rt_period_ns_);

  clock_nanosleep(
      CLOCK_MONOTONIC,
      TIMER_ABSTIME,
      &next_time,
      nullptr);

  RtLoopOnce();
}
```

这里最重要的是：

```cpp
clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, ...)
```

`TIMER_ABSTIME` 表示睡到一个绝对时间点，不是简单 sleep 一段时间。

比如 400 Hz：

```text
第 1 次: t0 + 2.5ms
第 2 次: t0 + 5.0ms
第 3 次: t0 + 7.5ms
```

即使某一轮稍微晚了，下一轮仍然按原来的时间轴走，不会持续累积漂移。

### Target QoS

目标状态只需要最新值，不建议排队旧目标：

```cpp
auto target_qos = rclcpp::QoS(1);       // 队列大小 = 1
target_qos.best_effort();               // 尽最大努力交付
target_qos.durability_volatile();       // 不保留历史数据

target_sub_ = this->create_subscription<auto_aim_interfaces::msg::Target>(
    "/tracker/target",
    target_qos,
    [this](const auto_aim_interfaces::msg::Target::SharedPtr target_msg)
    {
      TargetCallback(target_msg);
    },
    sub_options);
```

这样做的目的是：

```text
只处理最新目标
旧目标直接丢弃
避免 target 消息堆积导致控制滞后
```

## 修改 CMake

修改完 `planning_trajectory` 后，`CMakeLists.txt` 需要链接 pthread：

```cmake
find_package(Threads REQUIRED)

target_link_libraries(${PROJECT_NAME}
  Threads::Threads
)
```

## 启动后验证

### 查看两个 container 是否存在

```bash
ps -ef | grep -E "vision_container|trajectory_container"
```

应该能看到：

```text
vision_container
trajectory_container
```

### 查看 CPU 亲和性

```bash
traj_pid=$(pgrep -f trajectory_container | head -n 1)
vision_pid=$(pgrep -f vision_container | head -n 1)

taskset -cp $traj_pid
taskset -cp $vision_pid
```

期望在 8 核调优 NUC 上看到：

```text
trajectory_container -> 7
vision_container     -> 4-6
```

如果某台 NUC 不支持这些 CPU，安全 taskset 会自动跳过，这是正常降级。

### 查看调度策略和实际运行 CPU

```bash
ps -eLo pid,tid,cls,rtprio,pri,psr,comm,args | grep -E "trajectory_container|traj_rt_loop|vision_container"
```

理想情况：

```text
traj_rt_loop     FF  80  7
vision_container TS  -   4/5/6
```

其中：

```text
FF:
  SCHED_FIFO

80:
  实时优先级

7:
  当前运行 CPU
```

如果看到：

```text
traj_rt_loop     TS  -   ...
```

说明这台 NUC 没拿到实时权限，线程已经自动降级。  
这时优先检查：

```bash
ulimit -r
ulimit -l
groups
```

### 查看 topic 频率

```bash
ros2 topic hz /trajectory/send
```

如果：

```yaml
send_frequency: 400.0
```

期望接近：

```text
average rate: 400
```

---

# 注意事项

## 15.1 lowlatency 不是硬实时

`linux-lowlatency` 能降低延迟，但不能保证硬实时。  
这套方案能减少 ROS 2 timer / executor 带来的抖动，但最终仍然会受到内核、驱动、中断、DDS、TF、publish 的影响。


## 频率不要盲目设高

不要盲目把 `send_frequency` 拉很高。

判断标准：

```text
周期 = 1 / send_frequency
```

需要满足：

```text
max_wake + max_cost < 周期
```

实际测试：

```text
400Hz:
  周期 2500us
  max_wake 约 110us
  max_cost 约 416us
  miss = 0
  比较稳

10000Hz:
  周期 100us
  max_wake 可能到 3000us 以上
  max_cost 可能 600us 以上
  miss 增加
  不适合
```

## 实时线程里尽量少做阻塞操作

`RtLoopOnce()` 里仍然有两个不是严格实时的点：

```text
1. tf2 lookupTransform
2. rclcpp publish
```

当前 400 Hz 下可以接受。  
如果后续还要进一步降低抖动，可以继续改成：

```text
普通线程缓存最新 gimbal_yaw / gimbal_pitch
实时线程只读缓存

实时线程直接写串口/CAN
或者减少 /trajectory/info 发布频率
```

## 日志不要高频打印

正式运行建议：

不要在实时线程每一轮里 `RCLCPP_INFO`。  
日志会涉及锁、字符串格式化、终端输出，可能影响周期。

## 检查清单

可以按这个顺序检查：

```text
1. uname -r
   确认 lowlatency

2. ulimit -r / ulimit -l / groups
   确认实时权限

3. cyclictest
   找出哪颗 CPU 的 Max 最小

4. grub CPU isolation
   按实际核心数隔离

5. node_params.yaml
   rt.cpu 改成这台 NUC 上最稳的 CPU

6. 启动 launch
   确认 vision_container 和 trajectory_container 分离

7. ps 查看 traj_rt_loop
   确认 FF / 80 / CPU

8. ros2 topic hz /trajectory/send
   确认发布频率

9. RT loop stats
   确认 max_wake / max_cost / miss
```
