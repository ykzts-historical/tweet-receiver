import path from 'path';
import StartServerPlugin from 'start-server-webpack-plugin';

export default (env = 'development') => ({
  entry: {
    server: path.join(__dirname, 'src', 'server.js'),
  },
  externals: [
    /^(?!(?:\.\.?)?\/)/,
  ],
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
          },
        },
      },
    ],
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'build'),
  },
  plugins: [
    new StartServerPlugin('server.js'),
  ]
});
