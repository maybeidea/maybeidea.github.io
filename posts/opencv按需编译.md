---
title: OpenCV按需编译
date: 2026-06-16
category: opencv
tags:
  - OpenCV
  - CMake
featuredFormula: 老大我编译opencv半小时了
quote:
publish: true
---
# apt 安装和版本确认

安装 C++ 开发包：

```bash
sudo apt update
sudo apt install libopencv-dev
```

查看 Ubuntu apt 仓库里的 OpenCV 包名和版本：

```bash
apt list '*opencv*' | grep opencv
```

这里用 `grep` 直接输出文字，否则会启用 less 分页显示。可以看到当前 Ubuntu 仓库里是 4.10 版本。

查看 `libopencv-dev` 的依赖：

```bash
apt-cache show libopencv-dev
```

这里能看到 `libopencv-dev` 已经依赖 `libopencv-contrib-dev`

验证本机 OpenCV 构建信息：

```bash
opencv_version --verbose
```

# CMake 里按需链接

即使用 apt 安装了完整 `libopencv-dev`，项目里也可以按需链接。

只用图片读写和基本图像处理时：

```cmake
find_package(OpenCV 4.10 REQUIRED COMPONENTS core imgproc imgcodecs)

add_executable(demo main.cpp)
target_link_libraries(demo PRIVATE ${OpenCV_LIBS})
```

头文件也按模块写，显式指定头文件能显著**减少预编译时间**：

```cpp
#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>
#include <opencv2/imgcodecs.hpp>
```

# 源码按需编译

项目侧用 `find_package(OpenCV REQUIRED COMPONENTS ...)` 管住链接边界；发行版侧用 apt 省事；真要控制模块、后端和体积，再从源码 CMake 裁剪。

## 源码构建：按需裁剪模块

apt 安装的是 Ubuntu 已经编译好的 OpenCV。按模块安装 `libopencv-xxx-dev` 可以少装一些开发包，也能让 C++ 项目依赖关系更清楚，但它不能改变这些 `.so` 当初是怎么被编译出来的。

源码构建解决的是另一件事：自己决定哪些模块参与编译、哪些第三方后端启用、是否加入 CUDA、是否加入 contrib

### 基本构建流程

源码构建通常分三步：

```bash
cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/opt/opencv-4.10-min

cmake --build build -j"$(nproc)"

sudo cmake --install build
```

|选项|含义|
|---|---|
| `-S .` |OpenCV 源码目录|
| `-B build` |CMake 构建目录|
| `-G Ninja` |使用 Ninja 作为构建器|
| `CMAKE_BUILD_TYPE=Release` |生成 release 版本|
| `CMAKE_INSTALL_PREFIX=/opt/opencv-4.10-min` |安装到指定目录，避免覆盖系统 `/usr` 下的 OpenCV|

> [!tip]  
> 自编译版本建议装到 `/opt/opencv-4.10-*`。不要直接覆盖 apt 安装的 `/usr` 版本，否则后面排查链接路径会很麻烦。

### 只构建指定模块

`BUILD_LIST` 用来指定“我想构建哪些模块”。

```bash
cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/opt/opencv-4.10-min \
  -DBUILD_LIST=core,imgproc,imgcodecs \
  -DBUILD_TESTS=OFF \
  -DBUILD_PERF_TESTS=OFF \
  -DBUILD_EXAMPLES=OFF \
  -DBUILD_opencv_apps=OFF

cmake --build build -j"$(nproc)"
sudo cmake --install build
```

`BUILD_LIST=core,imgproc,imgcodecs` 不是“只链接这些模块”，而是“只要求构建这些模块”。如果某个模块依赖其他模块，OpenCV 会在配置阶段自动补齐。

例如请求 `calib3d` 时，CMake 可能会自动带上 `core`、`imgproc`、`features2d`、`flann` 等依赖。最终以配置输出里的 `OpenCV modules` 为准。

### 关闭单个模块

如果只是想在默认构建基础上排除某个模块，可以用 `BUILD_opencv_<module>=OFF`：

```bash
cmake -S . -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/opt/opencv-4.10-custom \
  -DBUILD_opencv_highgui=OFF
```

这个写法适合“基本都要，只排除少数模块”的情况。

如果目标是最小化体积，更推荐用 `BUILD_LIST` 白名单。

### 常用 CMake 选项

源码构建 OpenCV 时，常见选项大致分成几类。

构建类型和安装位置：

```bash
-DCMAKE_BUILD_TYPE=Release
-DCMAKE_INSTALL_PREFIX=/opt/opencv-4.10-custom
-DCMAKE_CXX_STANDARD=17
```

模块裁剪：

```bash
-DBUILD_LIST=core,imgproc,imgcodecs
-DBUILD_opencv_highgui=OFF
-DBUILD_SHARED_LIBS=ON
```

测试、示例、工具：

```bash
-DBUILD_TESTS=OFF
-DBUILD_PERF_TESTS=OFF
-DBUILD_EXAMPLES=OFF
-DBUILD_opencv_apps=OFF
```

语言绑定：

```bash
-DBUILD_JAVA=OFF
-DBUILD_opencv_python3=OFF
```

图片、视频、GUI 后端：

```bash
-DWITH_FFMPEG=ON
-DWITH_GSTREAMER=ON
-DWITH_V4L=ON
-DWITH_GTK=ON
-DWITH_QT=OFF
-DWITH_OPENGL=OFF
```

contrib 与 nonfree：

```bash
-DOPENCV_EXTRA_MODULES_PATH=opencv_contrib/modules
-DOPENCV_ENABLE_NONFREE=OFF
```

其他辅助选项：

```bash
-DOPENCV_GENERATE_PKGCONFIG=ON
-DENABLE_CCACHE=ON
```

> [!note]  
> `WITH_XXX` 通常表示是否启用某个外部依赖或后端，例如 FFmpeg、GStreamer、CUDA。  
> `BUILD_XXX` 通常表示是否构建某个模块、测试、示例或 OpenCV 自带的第三方库。

### 加入 contrib 模块

Ubuntu apt 的 `libopencv-dev` 已经依赖 contrib 开发包，这是 Ubuntu 打包层面的结果。

自己从源码构建时，contrib 仍然需要显式加入：

```bash
cmake -S opencv -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/opt/opencv-4.10-contrib \
  -DOPENCV_EXTRA_MODULES_PATH=opencv_contrib/modules
```

目录通常长这样：

```text
workspace/
├── opencv/
├── opencv_contrib/
└── build/
```

> [!warning]  
> `opencv` 和 `opencv_contrib` 必须来自同一个版本。  
> 例如 OpenCV 4.10 对应 opencv_contrib 4.10。不要混用不同 tag 或不同分支。

如果只想构建少量 contrib 模块，可以和 `BUILD_LIST` 一起使用：

```bash
cmake -S opencv -B build -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/opt/opencv-4.10-contrib-min \
  -DOPENCV_EXTRA_MODULES_PATH=opencv_contrib/modules \
  -DBUILD_LIST=core,imgproc,imgcodecs,ximgproc,quality \
  -DBUILD_TESTS=OFF \
  -DBUILD_PERF_TESTS=OFF \
  -DBUILD_EXAMPLES=OFF
```

### 启用 CUDA 加速

CUDA 构建和普通构建的差别主要在三点：

第一，系统里要先有可用的 NVIDIA 驱动和 CUDA Toolkit。

可以先检查：

```bash
nvidia-smi
nvcc --version
```

第二，OpenCV 4.x 的 CUDA 加速算法模块在 `opencv_contrib` 里，所以通常要同时提供 `opencv_contrib/modules`。

第三，`WITH_CUDA=ON` 只是启用 CUDA 支持；如果要让 `dnn` 使用 CUDA 后端，还需要 `OPENCV_DNN_CUDA=ON`。

一个常用的 CUDA 构建命令如下：

```bash
cmake -S opencv -B build-cuda -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/opt/opencv-4.10-cuda \
  -DOPENCV_EXTRA_MODULES_PATH=opencv_contrib/modules \
  -DBUILD_LIST=core,imgproc,imgcodecs,dnn,cudaarithm,cudaimgproc,cudawarping,cudafilters,cudafeatures2d,cudaoptflow \
  -DWITH_CUDA=ON \
  -DWITH_CUBLAS=ON \
  -DWITH_CUDNN=ON \
  -DOPENCV_DNN_CUDA=ON \
  -DCUDA_ARCH_BIN=8.6 \
  -DBUILD_TESTS=OFF \
  -DBUILD_PERF_TESTS=OFF \
  -DBUILD_EXAMPLES=OFF \
  -DBUILD_opencv_apps=OFF \
  -DBUILD_JAVA=OFF \
  -DBUILD_opencv_python3=OFF

cmake --build build-cuda -j"$(nproc)"
sudo cmake --install build-cuda
```

`CUDA_ARCH_BIN` 要按显卡的 compute capability 填。比如 RTX 30 系常见是 `8.6`，RTX 40 系常见是 `8.9`，Jetson Orin 常见是 `8.7`。不确定时先查 NVIDIA 官方表。

> [!note]  
> 编译出 CUDA 支持，不等于所有代码都会自动跑在 GPU 上。  
> 普通 `cv::resize`、`cv::cvtColor` 仍然走 CPU。要用 CUDA 算法，需要调用 `cv::cuda::resize`、`cv::cuda::cvtColor` 这类接口。  
> DNN 也需要在代码里显式选择 CUDA backend 和 target。

## 验证最终构建结果

安装后先看模块列表：

```bash
/opt/opencv-4.10-min/bin/opencv_version --verbose
```

只看模块相关内容：

```bash
/opt/opencv-4.10-min/bin/opencv_version --verbose | sed -n '/OpenCV modules:/,/Unavailable:/p'
```

如果是 CUDA 构建，可以检查 CUDA、cuDNN、DNN backend 是否出现在构建信息里：

```bash
/opt/opencv-4.10-cuda/bin/opencv_version --verbose | grep -E "NVIDIA CUDA|cuDNN|NVIDIA GPU arch|DNN"
```

C++ 项目里使用自编译版本时，指定 `OpenCV_DIR`：

```bash
cmake -S . -B build \
  -DOpenCV_DIR=/opt/opencv-4.10-cuda/lib/cmake/opencv4
```

然后在项目里按需链接模块：

```cmake
find_package(OpenCV 4.10 REQUIRED COMPONENTS core imgproc imgcodecs dnn)

target_link_libraries(demo PRIVATE ${OpenCV_LIBS})
```

源码构建决定“OpenCV 自己包含什么能力”。  
项目里的 `find_package(... COMPONENTS ...)` 决定“这个 C++ 程序链接哪些模块”。  
这两层不要混在一起。