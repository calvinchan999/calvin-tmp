{
    test: /\.(png|jpg|woff|svg|eot|ttf|woff2)$/,
    exclude:/node_modules/,
    use: [{
        loader: 'url-loader',
        options: {
            limit: 8 * 1024,
            name: "[name].[ext]?[hash]",
            exModule: false
        }
    }]
}