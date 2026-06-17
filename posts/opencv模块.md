---
title: OpenCV主要模块短的介绍
date: 2026-06-17
category: opencv
tags:
  - OpenCV
featuredFormula: 速查opencv模块分工
quote:
quoteLink:
publish: true
---
# 模块关系

粗略看，`core` 是底座，其他模块围绕它展开：

```text
core
 ├─ imgproc
 │   ├─ imgcodecs
 │   ├─ video
 │   ├─ features2d ─ flann
 │   │   └─ calib3d
 │   ├─ objdetect
 │   ├─ photo
 │   └─ stitching
 ├─ videoio
 │   └─ highgui
 ├─ dnn
 ├─ ml
 ├─ gapi
 └─ contrib
```

这不是严格依赖图，只是选模块时的心智模型。

# core

`core` 是 OpenCV 的基础模块。只要写 C++ OpenCV，基本就会用到它。

常见内容：

```cpp
cv::Mat
cv::UMat
cv::Scalar
cv::Point
cv::Size
cv::Rect
cv::Range
cv::InputArray
cv::OutputArray
```

常见函数：

```cpp
cv::add
cv::subtract
cv::multiply
cv::divide
cv::normalize
cv::minMaxLoc
cv::mean
cv::meanStdDev
cv::split
cv::merge
cv::FileStorage
```

典型头文件：

```cpp
#include <opencv2/core.hpp>
```

如果一个项目连 `core` 都不需要，那它大概率不是 OpenCV 项目。

# imgproc

`imgproc` 是传统图像处理主力模块。

它负责：

```text
颜色空间转换
滤波
形态学
阈值
边缘
轮廓
几何变换
直方图
```

常见函数：

```cpp
cv::cvtColor
cv::resize
cv::GaussianBlur
cv::medianBlur
cv::threshold
cv::adaptiveThreshold
cv::Canny
cv::Sobel
cv::erode
cv::dilate
cv::morphologyEx
cv::findContours
cv::warpAffine
cv::warpPerspective
cv::remap
```

典型头文件：

```cpp
#include <opencv2/imgproc.hpp>
```

只要做图像算法，通常就是 `core + imgproc` 起步。

# imgcodecs

`imgcodecs` 负责图片文件和内存 buffer 的编解码。

常见函数：

```cpp
cv::imread
cv::imwrite
cv::imdecode
cv::imencode
cv::haveImageReader
cv::haveImageWriter
```

典型头文件：

```cpp
#include <opencv2/imgcodecs.hpp>
```

`imread` 和 `imwrite` 不在 `highgui`。

# videoio

`videoio` 负责视频文件、摄像头、视频流的读写接口。

常见类：

```cpp
cv::VideoCapture
cv::VideoWriter
```

常见后端标识：

```cpp
cv::CAP_V4L2
cv::CAP_FFMPEG
cv::CAP_GSTREAMER
```

典型头文件：

```cpp
#include <opencv2/videoio.hpp>
```

`videoio` 是抽象层，不是 codec 本身。能不能读某个 MP 4、RTSP、camera device，取决于构建时启用了哪些后端，以及系统里对应库是否可用。

# highgui

`highgui` 负责简单 GUI 和调试窗口。

常见函数：

```cpp
cv::imshow
cv::waitKey
cv::namedWindow
cv::destroyAllWindows
cv::setMouseCallback
cv::createTrackbar
```

典型头文件：

```cpp
#include <opencv2/highgui.hpp>
```

它适合调试，不适合当完整 GUI 框架用。服务端、容器、嵌入式环境里，经常会主动关掉它。

# video

`video` 负责视频分析，不负责视频读写。

常见内容：

```cpp
cv::calcOpticalFlowPyrLK
cv::calcOpticalFlowFarneback
cv::createBackgroundSubtractorMOG2
cv::createBackgroundSubtractorKNN
cv::CamShift
cv::meanShift
cv::KalmanFilter
```

典型头文件：

```cpp
#include <opencv2/video.hpp>
```

它常和 `videoio` 一起出现，但分工不同：`videoio` 读帧，`video` 分析帧。

# calib3d

`calib3d` 负责相机几何。

常见任务：

```text
相机标定
畸变校正
PnP 位姿估计
单应矩阵
基础矩阵
双目标定
三角化
立体匹配
```

常见函数和类：

```cpp
cv::calibrateCamera
cv::undistort
cv::initUndistortRectifyMap
cv::solvePnP
cv::findHomography
cv::findFundamentalMat
cv::triangulatePoints
cv::StereoBM
cv::StereoSGBM
```

典型头文件：

```cpp
#include <opencv2/calib3d.hpp>
```

机器人视觉、AR、双目深度，基本都会碰到这个模块。

# features2d

`features2d` 负责特征点、描述子和匹配框架。

常见类：

```cpp
cv::ORB
cv::SIFT
cv::AKAZE
cv::BRISK
cv::BFMatcher
cv::DescriptorMatcher
```

常见函数：

```cpp
cv::drawKeypoints
cv::drawMatches
```

典型头文件：

```cpp
#include <opencv2/features2d.hpp>
```

拼接、图像检索、传统定位、SLAM 前端都会用到它。

# flann

`flann` 负责高维近似最近邻搜索。

常见类：

```cpp
cv::flann::Index
cv::FlannBasedMatcher
```

典型头文件：

```cpp
#include <opencv2/flann.hpp>
```

# objdetect

`objdetect` 负责传统目标检测和部分 marker / code 检测。

常见类：

```cpp
cv::CascadeClassifier
cv::HOGDescriptor
cv::QRCodeDetector
cv::aruco::ArucoDetector
```

典型头文件：

```cpp
#include <opencv2/objdetect.hpp>
```

Haar/LBP cascade、行人 HOG、二维码、ArUco 这类功能都在它附近。

# dnn

`dnn` 负责深度学习模型推理。

常见函数和类：

```cpp
cv::dnn::readNet
cv::dnn::readNetFromONNX
cv::dnn::blobFromImage
cv::dnn::NMSBoxes
cv::dnn::Net::setInput
cv::dnn::Net::forward
```

典型头文件：

```cpp
#include <opencv2/dnn.hpp>
```

`dnn` 不负责训练。训练交给 PyTorch、TensorFlow 等框架；OpenCV 负责部署时读模型、预处理、前向推理、后处理。

# ml

`ml` 是传统机器学习模块。

常见类：

```cpp
cv::ml::SVM
cv::ml::KNearest
cv::ml::RTrees
cv::ml::Boost
cv::ml::EM
```

典型头文件：

```cpp
#include <opencv2/ml.hpp>
```

它适合小型分类、回归、聚类任务。现代深度学习项目里不一定会用到。

# photo

`photo` 负责计算摄影类功能。

常见函数：

```cpp
cv::inpaint
cv::fastNlMeansDenoising
cv::fastNlMeansDenoisingColored
cv::detailEnhance
cv::edgePreservingFilter
```

常见 HDR 相关接口：

```cpp
cv::createMergeDebevec
cv::createMergeMertens
```

典型头文件：

```cpp
#include <opencv2/photo.hpp>
```

图像修复、去噪、HDR、风格化处理。

# stitching

`stitching` 是全景拼接的高层封装。

常见类：

```cpp
cv::Stitcher
```

典型用法：

```cpp
cv::Stitcher::create
stitcher->stitch
```

典型头文件：

```cpp
#include <opencv2/stitching.hpp>
```

如果你想自己控制特征、匹配、单应估计、曝光补偿、融合，那会拆到 `features2d + calib3d + imgproc` 等模块。

# gapi

`gapi` 是 Graph API。

它把处理过程表达成图，再交给后端执行。

常见内容：

```cpp
cv::GMat
cv::GComputation
cv::gapi::resize
cv::gapi::BGR2Gray
```

典型头文件：

```cpp
#include <opencv2/gapi.hpp>
```

普通脚本式图像处理不一定需要它。它更适合管线化、批处理、异构执行这类场景。

# contrib

## ximgproc

扩展图像处理模块。

常见内容：

```text
guided filter
superpixel
thinning
edge-preserving filter
```

它是 `imgproc` 的补充，不是替代。

## xfeatures2d

扩展特征模块。

常见内容：

```text
SURF
BriefDescriptorExtractor
FREAK
DAISY
```

部分算法可能受 `OPENCV_ENABLE_NONFREE` 影响。apt 包里具体启用了什么，以 `opencv_version --verbose` 和头文件/API 可用性为准。

## tracking

传统跟踪模块。

常见类：

```cpp
cv::TrackerKCF
cv::TrackerCSRT
```

适合传统单目标跟踪。复杂多目标跟踪通常还会结合检测器、ReID、Kalman filter、匈牙利匹配等逻辑。

## face

传统人脸识别模块。

常见内容：

```text
EigenFace
FisherFace
LBPH
```

它不是现代深度人脸识别框架。要做人脸 embedding、检索、活体等，通常会走 DNN 或外部模型。

## wechat_qrcode

微信二维码检测模块。

常见类：

```cpp
cv::wechat_qrcode::WeChatQRCode
```

它比基础 `cv::QRCodeDetector` 更重，依赖也更多。只有基础二维码需求时，先试 `objdetect` 里的 `QRCodeDetector`。

## quality

图像质量评价模块。

常见内容：

```text
PSNR
SSIM
BRISQUE
```

适合做图像质量分析、压缩质量对比、退化评估。

## viz

3D 可视化模块。

常见类：

```cpp
cv::viz::Viz3d
cv::viz::WCloud
```

它依赖 VTK，部署体积和依赖都更重。普通服务端程序通常不带它。

## cuda*

CUDA 相关模块包括：

```text
cudaarithm
cudaimgproc
cudawarping
cudafilters
cudaobjdetect
cudaoptflow
```

常见基础类型：

```cpp
cv::cuda::GpuMat
```

apt 默认包不等于你的机器上就有可用 CUDA 版 OpenCV。CUDA 通常需要自己按显卡、CUDA Toolkit、cuDNN、架构号重新构建。

# world 和 ts

`world` 是聚合库，不是算法模块。

它把多个模块打成一个 `opencv_world`。链接方便，但边界粗，部署时容易把不需要的东西也带上。

`ts` 是测试支持模块，主要给 OpenCV 自己的测试用。普通业务代码不用关心。