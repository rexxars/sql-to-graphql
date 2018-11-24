import db from './db'
import _mapKeys from 'lodash/mapKeys'
import _pick from 'lodash/pick'
import _omit from 'lodash/omit'

export const findOne = (bridge, args) => {
  const colArgs = _mapKeys(args, (_, field) => bridge.fieldColumnMap[field])
  return new Promise((resolve, reject) => {
    db()
      .select(bridge.fieldColumnMap)
      .from(bridge.tableName)
      .where(colArgs)
      .then(rows => resolve(rows[0]))
      .catch(err => reject(err))
  })
}

export const find = (bridge, args) => {
  const colArgs = _mapKeys(args, (_, field) => bridge.fieldColumnMap[field])
  return new Promise((resolve, reject) => {
    db()
      .select(bridge.fieldColumnMap)
      .from(bridge.tableName)
      .where(colArgs)
      .then(rows => resolve(rows))
      .catch(err => reject(err))
  })
}

export const create = (bridge, args) => {
  new Promise((resolve, reject) => {
    const columns = _mapKeys(args, (_, field) => bridge.fieldColumnMap[field])
    db()
      .insert(columns)
      .into(bridge.tableName)
      .then(_ => resolve(args))
      .catch(err => reject(err))
  })
}

export const findOneAndUpdate = (bridge, args) => {
  new Promise((resolve, reject) => {
    const colFields = _mapKeys(args, (_, field) => bridge.fieldColumnMap[field])
    const filterPK = _pick(colFields, bridge.pkField)
    const updateFields = _omit(colFields, bridge.pkField)
    db(bridge.tableName)
      .where(filterPK)
      .update(updateFields)
      .then(() =>
        db()
          .select(bridge.fieldColumnMap)
          .from(bridge.tableName)
          .where(filterPK)
          .then(rows => resolve(rows[0]))
          .catch(err => reject(err))
      )
      .catch(err => reject(err))
  })
}

export const findOneAndDelete = (bridge, args) => {
  new Promise((resolve, reject) => {
    const colFields = _mapKeys(args, (_, field) => bridge.fieldColumnMap[field])
    const filterPK = _pick(colFields, bridge.pkField)
    db(bridge.tableName)
      .where(filterPK)
      .del()
      .then(res => {
        console.log(res)
        resolve(filterPK)
      })
      .catch(err => reject(err))
  })
}
