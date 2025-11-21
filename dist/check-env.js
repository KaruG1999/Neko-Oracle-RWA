"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load environment variables
dotenv_1.default.config();
const envVars = [
    {
        name: "API_KEY",
        required: true,
        description: "AlphaVantage or Finnhub API key",
    },
    {
        name: "ASSET_ID",
        required: true,
        description: "Asset symbol (e.g., TSLA)",
    },
    {
        name: "SOROBAN_RPC",
        required: true,
        description: "Soroban RPC URL (e.g., https://rpc-futurenet.stellar.org)",
    },
    {
        name: "ORACLE_CONTRACT_ID",
        required: true,
        description: "Soroban oracle contract ID",
    },
    {
        name: "ORACLE_SECRET_KEY",
        required: true,
        description: "Stellar secret key for signing transactions",
    },
    {
        name: "LOG_LEVEL",
        required: false,
        description: "Logging level (default: info)",
    },
    {
        name: "PORT",
        required: false,
        description: "Express server port (default: 3000)",
    },
];
function checkEnvVars() {
    const missing = [];
    const warnings = [];
    console.log("Checking environment variables...\n");
    for (const envVar of envVars) {
        const value = process.env[envVar.name];
        if (!value || value.trim() === "") {
            if (envVar.required) {
                missing.push(envVar.name);
                console.log(`[MISSING] ${envVar.name} - ${envVar.description || "Required"}`);
            }
            else {
                warnings.push(envVar.name);
                console.log(`[OPTIONAL] ${envVar.name} - ${envVar.description || "Optional"} (not set)`);
            }
        }
        else {
            // Mask sensitive values
            const displayValue = envVar.name.includes("KEY") || envVar.name.includes("SECRET")
                ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
                : value;
            console.log(`[OK] ${envVar.name} = ${displayValue}`);
        }
    }
    return { valid: missing.length === 0, missing, warnings };
}
function checkEnvFile() {
    const envPath = path.join(process.cwd(), ".env");
    const envExamplePath = path.join(process.cwd(), ".env.example");
    console.log("\nChecking .env file...");
    if (!fs.existsSync(envPath)) {
        console.log(`[ERROR] .env file not found at: ${envPath}`);
        if (fs.existsSync(envExamplePath)) {
            console.log(`[INFO] Found .env.example at: ${envExamplePath}`);
            console.log("[INFO] Copy .env.example to .env and fill in your values");
        }
        else {
            console.log("[WARN] .env.example not found");
        }
        return false;
    }
    console.log(`[OK] .env file found at: ${envPath}`);
    return true;
}
function main() {
    console.log("=".repeat(60));
    console.log("Environment Variables Checker");
    console.log("=".repeat(60));
    console.log();
    const envFileExists = checkEnvFile();
    console.log();
    const result = checkEnvVars();
    console.log();
    console.log("=".repeat(60));
    if (!result.valid) {
        console.log("\n[FAILED] Missing required environment variables:");
        result.missing.forEach((varName) => {
            console.log(`  - ${varName}`);
        });
        console.log("\nPlease set these variables in your .env file");
        console.log("or export them in your environment.");
        process.exit(1);
    }
    if (result.warnings.length > 0) {
        console.log("\n[WARN] Optional variables not set:");
        result.warnings.forEach((varName) => {
            console.log(`  - ${varName}`);
        });
        console.log("\nThese are optional and will use default values.");
    }
    if (result.valid) {
        console.log("\n[SUCCESS] All required environment variables are set!");
        console.log("\nYou can now run the application with:");
        console.log("  npm run dev     (development)");
        console.log("  npm start       (production)");
    }
    console.log();
}
main();
//# sourceMappingURL=check-env.js.map