import DataLoader from 'dataloader';
import * as R from 'ramda';

export const MAX_BATCH_SIZE = 300;

export const batchLoader = (loader) => {
  const dataLoader = new DataLoader(
    (objects) => {
      const { ctx } = R.head(objects);
      const ids = objects.map((i) => i.id);
      return loader(ctx, ids);
    },
    { maxBatchSize: MAX_BATCH_SIZE }
  );
  return {
    load: (ctx, id) => {
      return dataLoader.load({ ctx, id });
    },
  };
};

const sqlTag = (parts, ...tokens) => {
  let sql = '';
  let bindings = [];
  parts.forEach((part, i) => {
    sql += part.replace(/\s*\n\s*/gm, ' ');
    if (i < parts.length - 1) {
      const token = tokens[i];
      if (token === undefined) {
        throw new Error(`Missing token at index ${i}`);
      }

      if (token.sql !== undefined) {
        sql += token.sql;
        bindings = [...bindings, ...token.bindings];
      } else {
        sql += '?';
        bindings = [...bindings, token];
      }
    }
  });

  return {
    sql: sql.trim(),
    bindings,
  };
};

const escapeIdentifier = (...idParts) =>
  idParts
    .map((id) => {
      if (typeof id !== 'string') {
        throw new Error('Identifier type must be a string.');
      }
      return `"${id.replace(/"/g, '""')}"`;
    })
    .join('.');

sqlTag.identifier = (...idParts) => ({
  sql: escapeIdentifier(...idParts),
  bindings: [],
});

sqlTag.identifiers = (identifiers) => ({
  sql: identifiers.map((id) => escapeIdentifier(id)).join(','),
  bindings: [],
});

sqlTag.bindings = (bindings) => ({
  sql: bindings.map(() => '?').join(','),
  bindings,
});

sqlTag.namedBindings = (namedBindings) => ({
  sql: Object.keys(namedBindings)
    .map((id) => `${escapeIdentifier(id)} = ?`)
    .join(','),
  bindings: Object.values(namedBindings),
});

sqlTag.order = (direction) => {
  const asc = direction === 'asc' || direction === true;
  const desc = direction === 'desc' || direction === false;
  if (!(asc || desc)) {
    throw new Error(`Invalid ordering direction ${direction}`);
  }
  return {
    sql: asc ? 'asc' : 'desc',
    bindings: [],
  };
};

const joinStatements = (operator, prefix) => (statements) => {
  let sql = '';
  let bindings = [];
  statements
    .filter((s) => s)
    .forEach((c, i) => {
      if (!(c.sql && c.bindings)) {
        throw new Error(`Invalid statement at index ${i}`);
      }

      if (i !== 0) {
        sql += ` ${operator} `;
      } else if (prefix) {
        sql += `${prefix} `;
      }
      sql += `(${c.sql})`;
      bindings = [...bindings, ...c.bindings];
    });
  return { sql, bindings };
};

sqlTag.and = joinStatements('and');
sqlTag.or = joinStatements('or');

sqlTag.where = {
  and: joinStatements('and', 'where'),
  or: joinStatements('or', 'where'),
};

export const sql = sqlTag;
export const sqlFragment = sqlTag;
