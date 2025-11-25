// webpack.config.js - Конфигурация сборщика Webpack, который собирает JavaScript и CSS файлы в один бандл
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Режим сборки (development - для разработки, production - для продакшена)
  mode: 'development',
  
  // Точка входа - главный JS файл, с которого начинается сборка
  entry: './src/index.js',
  
  // Настройки выходного файла сборки
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  // Указываем, что мы разрабатываем для Electron
  target: 'electron-renderer',
  
  // Правила обработки различных типов файлов
  module: {
    rules: [
      // Обработка JS и JSX файлов с помощью Babel
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      // Обработка CSS файлов
      {
        test: /\.css$/,
        use: [
          'style-loader', // Добавляет стили в DOM
          'css-loader',   // Обрабатывает CSS импорты
          'postcss-loader' // Для обработки PostCSS (включая Tailwind)
        ]
      },
      // Обработка файлов изображений и иконок
      {
        test: /\.(ico|png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]'
        }
      }
    ]
  },
  
  // Плагины для расширения функциональности Webpack
  plugins: [
    // Генерирует HTML файл на основе шаблона
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  
  // Настройки разрешения модулей
  resolve: {
    extensions: ['.js', '.jsx']
  }
};