"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
const db_1 = require("./lib/db");
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const customers_routes_1 = __importDefault(require("./routes/customers.routes"));
const employees_routes_1 = __importDefault(require("./routes/employees.routes"));
const services_routes_1 = __importDefault(require("./routes/services.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const serviceCategories_routes_1 = __importDefault(require("./routes/serviceCategories.routes"));
const productCategories_routes_1 = __importDefault(require("./routes/productCategories.routes"));
const pos_routes_1 = __importDefault(require("./routes/pos.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const appointments_routes_1 = __importDefault(require("./routes/appointments.routes"));
const customerSources_routes_1 = __importDefault(require("./routes/customerSources.routes"));
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/health', health_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/customers', customers_routes_1.default);
app.use('/api/employees', employees_routes_1.default);
app.use('/api/services', services_routes_1.default);
app.use('/api/products', products_routes_1.default);
app.use('/api/service-categories', serviceCategories_routes_1.default);
app.use('/api/product-categories', productCategories_routes_1.default);
app.use('/api/pos', pos_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/appointments', appointments_routes_1.default);
app.use('/api/customer-sources', customerSources_routes_1.default);
(0, db_1.connectMongo)()
    .then(() => {
    app.listen(config_1.config.port, () => {
        console.log(`API listening on http://localhost:${config_1.config.port}`);
    });
})
    .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
});
app.get("/", (req, res) => {
    res.send("API OK");
});
//# sourceMappingURL=index.js.map