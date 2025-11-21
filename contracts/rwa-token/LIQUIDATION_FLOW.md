# Flujo de Liquidación en RWA Token

## Conceptos Clave

### 1. Cuando abres un CDP (Collateralized Debt Position)

```
Usuario deposita:
  └─> Collateral (XLM, USDC, USDT) → Se guarda en el contrato dentro del CDP
  └─> Recibe RWA tokens prestados → Se mintean y van a tu wallet

Ejemplo:
- Depositas: 1000 XLM
- Recibes: 100 NVDA tokens (prestados)
- Estado: Tienes 100 NVDA en tu wallet, pero debes 100 NVDA al contrato
```

### 2. El Stability Pool (es SEPARADO del CDP)

```
Otros usuarios depositan:
  └─> RWA tokens propios → Van al Stability Pool del contrato
  
Ejemplo:
- Usuario A deposita: 50 NVDA tokens propios al pool
- Usuario B deposita: 30 NVDA tokens propios al pool
- Total en pool: 80 NVDA tokens

Propósito: Ganar recompensas cuando se liquida un CDP
```

## Flujo de Liquidación

### Escenario: Un CDP se vuelve insolvente

**Estado inicial:**

```
CDP de Alice:
  ├─ Collateral: 1000 XLM (en el contrato)
  ├─ Deuda: 100 NVDA tokens prestados
  
Stability Pool:
  ├─ Total RWA tokens: 80 NVDA (depositados por otros usuarios)
  ├─ Total recompensas: 0 XLM
```

**Cuando se liquida el CDP de Alice:**

```1852:1857:contracts/rwa-token/src/token.rs
        // Update the stability pool
        Self::subtract_total_rwa(env, liquidated_debt);
        Self::add_total_collateral(env, liquidated_collateral);

        // Burn the liquidated debt
        Self::burn_internal(env, env.current_contract_address(), liquidated_debt);
```

**Proceso:**

1. **Se usan RWA tokens del Stability Pool para pagar la deuda:**
   - Se toman 80 NVDA tokens del pool
   - Se usan para pagar 80 NVDA de la deuda de Alice
   - Estos 80 NVDA tokens se **queman** (se eliminan permanentemente)

2. **El collateral del CDP insolvente va al Stability Pool:**
   - El collateral proporcional (ej: 800 XLM) se mueve al pool como "recompensas"
   - Este XLM ahora está disponible para que los stakers lo reclamen

3. **Actualización del CDP:**
   ```1860:1867:contracts/rwa-token/src/token.rs
        let Some(xlm_deposited) = cdp.xlm_deposited.checked_sub(liquidated_collateral) else {
            return Err(Error::ArithmeticError);
        };
        let Some(asset_lent) = cdp.asset_lent.checked_sub(liquidated_debt) else {
            return Err(Error::ArithmeticError);
        };
        cdp.xlm_deposited = xlm_deposited;
        cdp.asset_lent = asset_lent;
   ```
   - Si la deuda se pagó completamente: CDP se cierra
   - Si queda deuda pendiente: CDP queda Frozen (congelado)

**Estado después de la liquidación:**

```
CDP de Alice:
  ├─ Collateral restante: 200 XLM (si solo se liquidó 80% de la deuda)
  ├─ Deuda restante: 20 NVDA tokens
  
Stability Pool:
  ├─ Total RWA tokens: 0 NVDA (se usaron para pagar la deuda)
  ├─ Total recompensas: 800 XLM (del collateral de Alice)
  
Recompensas para stakers:
  ├─ Usuario A (tenía 50 NVDA): Puede reclamar ~500 XLM
  ├─ Usuario B (tenía 30 NVDA): Puede reclamar ~300 XLM
```

## ¿Por qué funciona esto?

1. **El pool tiene RWA tokens** que otros usuarios depositaron voluntariamente para ganar recompensas
2. **En una liquidación:**
   - Los RWA tokens del pool se usan para pagar la deuda → Se queman
   - El collateral del CDP insolvente se distribuye a los stakers como recompensas
3. **Los stakers ganan** porque reciben collateral (XLM/USDC/USDT) a cambio de sus RWA tokens que se usaron en la liquidación

## Puntos Importantes

- ✅ **El collateral NO se liquida "en conjunto con el pool"**
- ✅ El pool tiene **RWA tokens** (el debit asset)
- ✅ El CDP tiene **collateral** (XLM, USDC, USDT)
- ✅ En liquidación: RWA tokens del pool → se usan para pagar deuda → se queman
- ✅ En liquidación: Collateral del CDP → va al pool → se distribuye a stakers como recompensas

## Ejemplo Numérico Completo

```
Estado Inicial:
- Alice abre CDP: Deposita 1000 XLM, recibe 100 NVDA prestados
- Bob deposita 60 NVDA al Stability Pool
- Carol deposita 40 NVDA al Stability Pool
- Pool total: 100 NVDA

El precio de XLM cae → CDP de Alice se vuelve insolvente

Liquidación:
- Se usan 100 NVDA del pool para pagar la deuda de Alice
- Se queman 100 NVDA (se eliminan)
- 900 XLM del collateral de Alice van al pool como recompensas
- Pool ahora tiene: 0 NVDA, 900 XLM en recompensas

Recompensas:
- Bob (60% del pool): Reclama 540 XLM
- Carol (40% del pool): Reclama 360 XLM

Alice:
- Perdió 900 XLM de su collateral
- Su deuda de 100 NVDA fue pagada
- Le quedan 100 XLM si quiere cerrar el CDP
```

