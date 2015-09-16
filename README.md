# gulp-seajs-css
把css文件包装成seajs的module

## Overview
- 自动进行压缩
- 配置参数prefix：文件名前缀，cleanCss：压缩CSS使用的clean-css的配置

## Input & Output
### 1、分块：
Input：

index/multi.css

    /**
     * 基础样式
     * @export base
     */
    body{
        background: #eee;
        color: #f02651;
        content: ''
    }
    /**
     * 头部
     * @export head
     * @author Homkai
     */
    .page-head{
        font-size: 200%;
    }
    
Output：

    define('index/css_multi', function(require, exports, module){
      exports.base = '<style type="text/css">body{background:#eee;color:#f02651;content:\'\'}</style>';
      exports.head = '<style type="text/css">.page-head{font-size:200%}</style>';
    });
    
### 2、不分块：
Input：

index/main.css

    body{
        background: #eee;
        color: #f02651;
        content: ''
    }
    .page-head{
        font-size: 200%;
    }
    
Output：

    define('index/css_multi', function(require, exports, module){
      module.exports = '<style type="text/css">body{background:#eee;color:#f02651;content:\'\'}.page-head{font-size:200%}</style>';
    });