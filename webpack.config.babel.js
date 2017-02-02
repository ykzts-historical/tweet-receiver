import HtmlPlugin from 'html-webpack-plugin';
import path from 'path';
import StartServerPlugin from 'start-server-webpack-plugin';
import merge from 'webpack-merge';

const commonConfig = {
  module: {
    rules: [
      {
        exclude: path.join(__dirname, 'node_modules'),
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [
              [
                'env',
                {
                  debug: true,
                  targets: {
                    node: 'current',
                  },
                  useBuiltIns: true,
                },
              ],
            ],
            plugins: [
              'date-fns'
            ]
          },
        },
      },
    ],
  },
};

const clientConfig = merge(commonConfig, {
  entry: {
    main: path.join(__dirname, 'src', 'client.js'),
  },
  output: {
    filename: '[name].js?[chunkhash]',
    path: path.join(__dirname, 'build', 'public'),
    publicPath: '/',
  },
  plugins: [
    new HtmlPlugin({
      template: path.join(__dirname, 'src', 'templates', 'index.html'),
    }),
  ],
});

const serverConfig = merge(commonConfig, {
  entry: {
    server: path.join(__dirname, 'src', 'server.js'),
  },
  externals: [
    /^(?!(?:\.\.?)?\/)/,
  ],
  node: {
    __dirname: false,
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'build'),
  },
  plugins: [
    new StartServerPlugin('server.js'),
  ],
  target: 'node',
});

export default (env = 'development') => {
  return [clientConfig, serverConfig];
};
