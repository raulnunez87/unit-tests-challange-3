# 🛡️ Branch Protection Rules

Este documento describe cómo configurar las reglas de protección de ramas para garantizar que solo el código que pasa todos los gates de seguridad pueda ser mergeado.

## 🔧 Configuración en GitHub

### 1. Ir a Settings del Repositorio

```
Settings > Branches > Add rule
```

### 2. Configurar Reglas para `main`

**Branch name pattern**: `main`

**Configuraciones requeridas**:

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `2`
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - ✅ Status checks required:
    - `build-test`
    - `security-sast-sca`
    - `security-dast` (opcional)

- ✅ **Require conversation resolution before merging**

- ✅ **Require signed commits**

- ✅ **Require linear history**

- ✅ **Include administrators**

- ✅ **Restrict pushes that create files larger than 100 MB**

### 3. Configurar Reglas para `develop`

**Branch name pattern**: `develop`

**Configuraciones requeridas**:

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale PR approvals when new commits are pushed

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - ✅ Status checks required:
    - `build-test`
    - `security-sast-sca`

- ✅ **Require conversation resolution before merging**

- ✅ **Include administrators**

## 🔧 Configuración en GitLab

### 1. Ir a Settings del Proyecto

```
Settings > Repository > Push Rules
```

### 2. Configurar Push Rules

**Branch name pattern**: `main`

- ✅ **Restrict pushes to this branch**
- ✅ **Require approval from code owners**
- ✅ **Require pipeline to succeed**
- ✅ **Require security scan to pass**

### 3. Configurar Merge Request Rules

```
Settings > Repository > Merge request rules
```

**Branch name pattern**: `main`

- ✅ **Require approval from code owners**
- ✅ **Require pipeline to succeed**
- ✅ **Require security scan to pass**
- ✅ **Require all discussions to be resolved**

## 📋 Checklist de Verificación

### ✅ Para Pull/Merge Requests

Antes de hacer merge, verifica que:

- [ ] **Approvals**: Número requerido de approvals obtenidos
- [ ] **Status Checks**: Todos los checks de CI/CD pasan
- [ ] **Security Scans**: Análisis de seguridad completados sin findings críticos
- [ ] **Code Review**: Revisión de código completada
- [ ] **Discussions**: Todas las discusiones resueltas
- [ ] **Branch Up to Date**: Rama actualizada con la rama base

### ❌ Criterios de Bloqueo

El merge será **BLOQUEADO** si:

- No se obtienen los approvals requeridos
- Algún status check falla
- Se detectan vulnerabilidades High/Critical
- La cobertura está por debajo del 80%
- Hay discusiones sin resolver
- La rama no está actualizada

## 🚨 Manejo de Emergencias

### Bypass Temporal de Protecciones

En casos de emergencia crítica, los administradores pueden:

1. **GitHub**: Usar "Merge without waiting for requirements to be met"
2. **GitLab**: Usar "Merge when pipeline succeeds" con permisos de administrador

### Proceso de Bypass

1. Documentar la razón del bypass
2. Crear issue de seguimiento para arreglar el problema
3. Notificar al equipo de seguridad
4. Revisar y corregir en el siguiente PR

## 🔍 Monitoreo y Alertas

### Configurar Notificaciones

**GitHub**:
- Settings > Notifications > Security alerts
- Settings > Notifications > Actions

**GitLab**:
- Settings > Notifications > Security alerts
- Settings > Notifications > Pipeline notifications

### Métricas a Monitorear

- Tiempo promedio de CI/CD
- Tasa de fallos de pipeline
- Número de bypasses de seguridad
- Tiempo promedio de code review
- Cobertura de tests

## 📚 Recursos Adicionales

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitLab Push Rules](https://docs.gitlab.com/ee/push_rules/push_rules.html)
- [Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Security Best Practices](https://docs.github.com/en/code-security)

---

**⚠️ Importante**: Estas reglas están diseñadas para proteger la integridad y seguridad del código. Solo los administradores pueden modificar estas configuraciones.
