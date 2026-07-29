/**
 * CodeItAll Lab Explain — hover/tap tooltips for syntax + line dots.
 * Desktop: hover. Mobile: tap/click. Tooltip always has a close (X).
 */
(function (global) {
  "use strict";

  const isTouchUi = () =>
    window.matchMedia("(hover: none), (pointer: coarse)").matches ||
    (navigator.maxTouchPoints || 0) > 0;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tipHtml(parts) {
    return parts.filter(Boolean).join("");
  }

  function p(html) {
    return `<p>${html}</p>`;
  }

  /** @type {Record<string, Record<string, {title: string, body: string}>>} */
  const LEX = {
    common: {
      "=": {
        title: "Assignment =",
        body: p(`The <span class="tip-op">=</span> operator stores a value into a name on the left.`),
      },
      "==": {
        title: "Equals ==",
        body: p(`Checks whether two values are equal. Result is true/false (or 0/1).`),
      },
      "!=": {
        title: "Not equal !=",
        body: p(`True when the two sides are not the same.`),
      },
      "+": {
        title: "Plus +",
        body: p(`Adds numbers, or joins strings in many languages.`),
      },
      "-": {
        title: "Minus -",
        body: p(`Subtracts numbers (or marks a negative number).`),
      },
      "*": {
        title: "Multiply *",
        body: p(`Multiplies numbers.`),
      },
      "/": {
        title: "Divide /",
        body: p(`Divides numbers.`),
      },
      "(": {
        title: "Opening (",
        body: p(`Starts a group: function call, condition, or expression.`),
      },
      ")": {
        title: "Closing )",
        body: p(`Ends the group that started with <code>(</code>.`),
      },
      "{": {
        title: "Opening {",
        body: p(`Starts a block of statements (or an object / set in some languages).`),
      },
      "}": {
        title: "Closing }",
        body: p(`Ends a block that started with <code>{</code>.`),
      },
      "[": {
        title: "Opening [",
        body: p(`Starts a list/array index, or an array literal.`),
      },
      "]": {
        title: "Closing ]",
        body: p(`Ends a list/array bracket that started with <code>[</code>.`),
      },
      ";": {
        title: "Semicolon ;",
        body: p(`Ends a statement in C++, JavaScript, SQL clients, etc.`),
      },
      ",": {
        title: "Comma ,",
        body: p(`Separates items in a list of arguments, values, or columns.`),
      },
      ".": {
        title: "Dot .",
        body: p(`Accesses a property or method on the thing to the left (also used in numbers).`),
      },
      ":": {
        title: "Colon :",
        body: p(`Starts a block (Python), a label, or separates keys/values depending on language.`),
      },
    },
    python: {
      def: {
        title: "def — define a function",
        body: p(`Creates a reusable block of code. After <span class="tip-kw">def</span> comes the <span class="tip-id">name</span>, then parameters in parentheses.`),
      },
      return: {
        title: "return — send a result back",
        body: p(`Leaves the function and hands a value back to the caller.`),
      },
      if: {
        title: "if — only when true",
        body: p(`Runs the indented block when the condition is true.`),
      },
      elif: {
        title: "elif — else if",
        body: p(`Another condition checked only if earlier <span class="tip-kw">if</span>/<span class="tip-kw">elif</span> failed.`),
      },
      else: {
        title: "else — fallback",
        body: p(`Runs when no earlier branch was true.`),
      },
      for: {
        title: "for — loop over items",
        body: p(`Repeats the indented block once for each item in a sequence.`),
      },
      while: {
        title: "while — loop while true",
        body: p(`Keeps repeating as long as the condition stays true.`),
      },
      import: {
        title: "import — load a library",
        body: p(`Brings in another module so you can use its tools.`),
      },
      from: {
        title: "from — import pieces",
        body: p(`Pulls specific names from a module (often followed by <span class="tip-kw">import</span>).`),
      },
      class: {
        title: "class — define a type",
        body: p(`Describes a blueprint for objects (data + methods).`),
      },
      try: {
        title: "try — attempt risky code",
        body: p(`Runs code and lets you handle errors in <span class="tip-kw">except</span>.`),
      },
      except: {
        title: "except — catch an error",
        body: p(`Runs if something inside <span class="tip-kw">try</span> failed.`),
      },
      with: {
        title: "with — manage resources",
        body: p(`Opens something (like a file) and cleans it up automatically afterward.`),
      },
      True: {
        title: "True",
        body: p(`Boolean yes / on / truthy constant.`),
      },
      False: {
        title: "False",
        body: p(`Boolean no / off / false constant.`),
      },
      None: {
        title: "None",
        body: p(`Means “no value” — Python’s empty placeholder.`),
      },
      print: {
        title: "print(…)",
        body: p(`Shows text (or other values) in the output area.`),
      },
      len: {
        title: "len(…)",
        body: p(`Returns how many items (or characters) are in something.`),
      },
      range: {
        title: "range(…)",
        body: p(`Makes a sequence of numbers — great for counting loops.`),
      },
      self: {
        title: "self",
        body: p(`Inside a method, refers to “this object”.`),
      },
      in: {
        title: "in",
        body: p(`Checks membership, or loops through a collection with <span class="tip-kw">for</span>.`),
      },
      and: {
        title: "and",
        body: p(`Logical AND — true only if both sides are true.`),
      },
      or: {
        title: "or",
        body: p(`Logical OR — true if either side is true.`),
      },
      not: {
        title: "not",
        body: p(`Flips true↔false.`),
      },
      lambda: {
        title: "lambda",
        body: p(`A tiny anonymous function written on one line.`),
      },
      as: {
        title: "as",
        body: p(`Gives a temporary name (import alias, exception, context manager).`),
      },
      pass: {
        title: "pass",
        body: p(`Placeholder that does nothing — keeps a block syntactically valid.`),
      },
      break: {
        title: "break",
        body: p(`Jumps out of the nearest loop immediately.`),
      },
      continue: {
        title: "continue",
        body: p(`Skips the rest of this loop cycle and starts the next one.`),
      },
    },
    javascript: {
      const: {
        title: "const — fixed binding",
        body: p(`Declares a name that cannot be reassigned. Prefer this by default.`),
      },
      let: {
        title: "let — reassignable variable",
        body: p(`Declares a block-scoped variable you can change later.`),
      },
      var: {
        title: "var — older variable",
        body: p(`Legacy declaration. Prefer <span class="tip-kw">let</span>/<span class="tip-kw">const</span>.`),
      },
      function: {
        title: "function",
        body: p(`Declares a named (or anonymous) function.`),
      },
      return: {
        title: "return",
        body: p(`Sends a value back and exits the function.`),
      },
      if: {
        title: "if",
        body: p(`Runs a block only when the condition is true.`),
      },
      else: {
        title: "else",
        body: p(`Runs when the matching <span class="tip-kw">if</span> was false.`),
      },
      for: {
        title: "for",
        body: p(`Classic loop — initializer, condition, step.`),
      },
      while: {
        title: "while",
        body: p(`Repeats while a condition stays true.`),
      },
      async: {
        title: "async",
        body: p(`Marks a function that can use <span class="tip-kw">await</span> for promises.`),
      },
      await: {
        title: "await",
        body: p(`Pauses an <span class="tip-kw">async</span> function until a Promise finishes.`),
      },
      new: {
        title: "new",
        body: p(`Creates an instance from a constructor/class.`),
      },
      class: {
        title: "class",
        body: p(`Defines a blueprint for objects with methods.`),
      },
      this: {
        title: "this",
        body: p(`Refers to the current object context (depends on how the function was called).`),
      },
      typeof: {
        title: "typeof",
        body: p(`Returns a string describing the type of a value.`),
      },
      console: {
        title: "console",
        body: p(`Browser/lab logging object. Usually followed by <code>.log</code>.`),
      },
      log: {
        title: "console.log",
        body: p(`Prints values to the lab output / browser console.`),
      },
      true: {
        title: "true",
        body: p(`Boolean yes.`),
      },
      false: {
        title: "false",
        body: p(`Boolean no.`),
      },
      null: {
        title: "null",
        body: p(`Intentional empty value.`),
      },
      undefined: {
        title: "undefined",
        body: p(`A value was never set (or a function returned nothing).`),
      },
      Promise: {
        title: "Promise",
        body: p(`Represents a value that will arrive later (async work).`),
      },
      document: {
        title: "document",
        body: p(`The webpage DOM — create elements, query nodes, etc.`),
      },
      Array: {
        title: "Array",
        body: p(`Built-in list type with methods like <code>map</code> and <code>filter</code>.`),
      },
      Math: {
        title: "Math",
        body: p(`Built-in math helpers like <code>random</code>, <code>floor</code>, <code>max</code>.`),
      },
      export: {
        title: "export",
        body: p(`Makes a value available to other modules.`),
      },
      import: {
        title: "import",
        body: p(`Loads values from another module.`),
      },
    },
    cpp: {
      include: {
        title: "#include",
        body: p(`Pulls in a header (library declarations) before compiling.`),
      },
      iostream: {
        title: "<iostream>",
        body: p(`Standard header for console input/output (<span class="tip-id">cin</span>/<span class="tip-id">cout</span>).`),
      },
      using: {
        title: "using",
        body: p(`Often <code>using namespace std;</code> — brings standard names into scope.`),
      },
      namespace: {
        title: "namespace",
        body: p(`Groups names so they don’t collide. <code>std</code> is the C++ standard library.`),
      },
      std: {
        title: "std",
        body: p(`The C++ standard library namespace.`),
      },
      int: {
        title: "int — integer type",
        body: p(`Stores whole numbers. <code>main</code> usually returns <span class="tip-kw">int</span>.`),
      },
      void: {
        title: "void",
        body: p(`Means “no return value” (or untyped pointer in older code).`),
      },
      bool: {
        title: "bool",
        body: p(`Boolean type: <code>true</code> or <code>false</code>.`),
      },
      char: {
        title: "char",
        body: p(`A single character (or small integer under the hood).`),
      },
      double: {
        title: "double",
        body: p(`Floating-point number with more precision than <code>float</code>.`),
      },
      string: {
        title: "string",
        body: p(`Text type from the standard library (<code>#include &lt;string&gt;</code>).`),
      },
      vector: {
        title: "vector",
        body: p(`Growable array from the STL. Great default container.`),
      },
      cout: {
        title: "cout — print",
        body: p(`Writes to the console. Use <span class="tip-op">&lt;&lt;</span> to send values out.`),
      },
      cin: {
        title: "cin — read input",
        body: p(`Reads from the console into a variable with <span class="tip-op">&gt;&gt;</span>.`),
      },
      endl: {
        title: "endl",
        body: p(`Ends the line and flushes output (a newline plus flush).`),
      },
      main: {
        title: "main",
        body: p(`Program entry point — execution starts here.`),
      },
      return: {
        title: "return",
        body: p(`Leaves a function. In <code>main</code>, <code>return 0</code> usually means success.`),
      },
      if: {
        title: "if",
        body: p(`Runs a block when the condition is true.`),
      },
      else: {
        title: "else",
        body: p(`Fallback when the <span class="tip-kw">if</span> condition was false.`),
      },
      for: {
        title: "for",
        body: p(`Loop with init / condition / step (or range-for over a container).`),
      },
      while: {
        title: "while",
        body: p(`Repeats while a condition is true.`),
      },
      class: {
        title: "class",
        body: p(`Defines a user type with data members and methods.`),
      },
      public: {
        title: "public:",
        body: p(`Members below are usable from outside the class.`),
      },
      private: {
        title: "private:",
        body: p(`Members below are only usable inside the class.`),
      },
      const: {
        title: "const",
        body: p(`Promises not to change this value (or method won’t mutate the object).`),
      },
      auto: {
        title: "auto",
        body: p(`Lets the compiler deduce the type from the initializer.`),
      },
      nullptr: {
        title: "nullptr",
        body: p(`A typed null pointer constant (prefer over <code>NULL</code>).`),
      },
      true: {
        title: "true",
        body: p(`Boolean true.`),
      },
      false: {
        title: "false",
        body: p(`Boolean false.`),
      },
      "<<": {
        title: "Stream <<",
        body: p(`Sends a value into an output stream like <span class="tip-id">cout</span>.`),
      },
      ">>": {
        title: "Stream >>",
        body: p(`Pulls a value from an input stream like <span class="tip-id">cin</span>.`),
      },
    },
    html: {
      html: {
        title: "<html>",
        body: p(`Root element wrapping the whole page.`),
      },
      head: {
        title: "<head>",
        body: p(`Metadata for the page: title, charset, styles, scripts.`),
      },
      body: {
        title: "<body>",
        body: p(`Visible page content lives here.`),
      },
      title: {
        title: "<title>",
        body: p(`Text shown in the browser tab.`),
      },
      meta: {
        title: "<meta>",
        body: p(`Page metadata (charset, viewport, description…).`),
      },
      h1: {
        title: "<h1>",
        body: p(`Top-level heading — usually one main title per page.`),
      },
      h2: {
        title: "<h2>",
        body: p(`Section heading under the main title.`),
      },
      p: {
        title: "<p>",
        body: p(`A paragraph of text.`),
      },
      a: {
        title: "<a>",
        body: p(`A hyperlink. The <span class="tip-id">href</span> attribute is the destination.`),
      },
      img: {
        title: "<img>",
        body: p(`Embeds an image. Always give meaningful <span class="tip-id">alt</span> text when it conveys info.`),
      },
      ul: {
        title: "<ul>",
        body: p(`Unordered (bulleted) list.`),
      },
      ol: {
        title: "<ol>",
        body: p(`Ordered (numbered) list.`),
      },
      li: {
        title: "<li>",
        body: p(`One item inside a list.`),
      },
      form: {
        title: "<form>",
        body: p(`Groups controls the user can submit.`),
      },
      input: {
        title: "<input>",
        body: p(`A form control. <span class="tip-id">type</span> chooses text, checkbox, radio, etc.`),
      },
      button: {
        title: "<button>",
        body: p(`A clickable button. Set <span class="tip-id">type</span> explicitly in forms.`),
      },
      label: {
        title: "<label>",
        body: p(`Caption for a control. Connect with <span class="tip-id">for</span>/<span class="tip-id">id</span>.`),
      },
      div: {
        title: "<div>",
        body: p(`Generic box for grouping. Prefer semantic tags when possible.`),
      },
      span: {
        title: "<span>",
        body: p(`Inline generic wrapper for a bit of text/markup.`),
      },
      table: {
        title: "<table>",
        body: p(`Starts a data table. Use <code>th</code>/<code>td</code> for cells.`),
      },
      thead: {
        title: "<thead>",
        body: p(`Header rows of a table.`),
      },
      tbody: {
        title: "<tbody>",
        body: p(`Body rows of a table.`),
      },
      tr: {
        title: "<tr>",
        body: p(`One table row.`),
      },
      th: {
        title: "<th>",
        body: p(`Header cell — describes a column or row.`),
      },
      td: {
        title: "<td>",
        body: p(`Normal data cell.`),
      },
      header: {
        title: "<header>",
        body: p(`Introductory content for a page or section.`),
      },
      main: {
        title: "<main>",
        body: p(`Primary content of the document.`),
      },
      footer: {
        title: "<footer>",
        body: p(`Footer for a page or section.`),
      },
      nav: {
        title: "<nav>",
        body: p(`Navigation links region.`),
      },
      section: {
        title: "<section>",
        body: p(`Thematic grouping of content.`),
      },
      article: {
        title: "<article>",
        body: p(`Self-contained composition (post, card, story).`),
      },
      DOCTYPE: {
        title: "<!DOCTYPE html>",
        body: p(`Tells the browser this is a modern HTML5 document.`),
      },
      href: {
        title: "href attribute",
        body: p(`Destination URL (or #id jump) for a link.`),
      },
      src: {
        title: "src attribute",
        body: p(`Source URL for media like images, audio, video, scripts.`),
      },
      alt: {
        title: "alt attribute",
        body: p(`Text alternative for an image — critical for accessibility.`),
      },
      class: {
        title: "class attribute",
        body: p(`CSS / JS hook name(s) for styling or selecting elements.`),
      },
      id: {
        title: "id attribute",
        body: p(`Unique name for one element on the page.`),
      },
      style: {
        title: "<style> / style=",
        body: p(`CSS styling — either a block in <code>head</code> or an inline attribute.`),
      },
    },
    sql: {
      SELECT: {
        title: "SELECT — ask for data",
        body: p(`Chooses which columns (or expressions) to return.`),
      },
      FROM: {
        title: "FROM — which table",
        body: p(`Names the table (or subquery) rows come from.`),
      },
      WHERE: {
        title: "WHERE — filter rows",
        body: p(`Keeps only rows that match a condition.`),
      },
      ORDER: {
        title: "ORDER BY — sort",
        body: p(`Sorts the result. Often followed by <span class="tip-kw">ASC</span>/<span class="tip-kw">DESC</span>.`),
      },
      BY: {
        title: "BY",
        body: p(`Part of phrases like <span class="tip-kw">ORDER BY</span> or <span class="tip-kw">GROUP BY</span>.`),
      },
      GROUP: {
        title: "GROUP BY — bucket rows",
        body: p(`Clusters rows so aggregates (COUNT, SUM…) compute per group.`),
      },
      HAVING: {
        title: "HAVING — filter groups",
        body: p(`Like WHERE, but applied after aggregation.`),
      },
      JOIN: {
        title: "JOIN — combine tables",
        body: p(`Connects rows from two tables using a match condition.`),
      },
      INNER: {
        title: "INNER JOIN",
        body: p(`Keeps only rows that match on both sides.`),
      },
      LEFT: {
        title: "LEFT JOIN",
        body: p(`Keeps all left-table rows; missing right matches become NULL.`),
      },
      ON: {
        title: "ON — join condition",
        body: p(`Says how two tables match (e.g. <code>a.id = b.a_id</code>).`),
      },
      INSERT: {
        title: "INSERT — add rows",
        body: p(`Writes new data into a table, usually with <span class="tip-kw">VALUES</span>.`),
      },
      INTO: {
        title: "INTO",
        body: p(`Names the destination table for <span class="tip-kw">INSERT</span>.`),
      },
      VALUES: {
        title: "VALUES",
        body: p(`Lists the data being inserted.`),
      },
      UPDATE: {
        title: "UPDATE — change rows",
        body: p(`Modifies existing rows. Almost always pair with <span class="tip-kw">WHERE</span>.`),
      },
      SET: {
        title: "SET",
        body: p(`Assigns new column values in an <span class="tip-kw">UPDATE</span>.`),
      },
      DELETE: {
        title: "DELETE — remove rows",
        body: p(`Deletes rows matching <span class="tip-kw">WHERE</span> (careful without WHERE!).`),
      },
      CREATE: {
        title: "CREATE — make a structure",
        body: p(`Creates a table, view, index, trigger, etc.`),
      },
      TABLE: {
        title: "TABLE",
        body: p(`A grid of rows/columns that stores your data.`),
      },
      DROP: {
        title: "DROP — remove a structure",
        body: p(`Deletes a table/view/index definition (and its data for tables).`),
      },
      ALTER: {
        title: "ALTER",
        body: p(`Changes an existing table structure.`),
      },
      AS: {
        title: "AS — alias",
        body: p(`Gives a temporary nickname to a column, table, or CTE.`),
      },
      AND: {
        title: "AND",
        body: p(`Both conditions must be true.`),
      },
      OR: {
        title: "OR",
        body: p(`Either condition can be true.`),
      },
      NOT: {
        title: "NOT",
        body: p(`Negates a condition.`),
      },
      NULL: {
        title: "NULL",
        body: p(`Unknown / missing value. Compare with <span class="tip-kw">IS NULL</span>, not <code>=</code>.`),
      },
      IS: {
        title: "IS",
        body: p(`Used in <span class="tip-kw">IS NULL</span> / <span class="tip-kw">IS NOT NULL</span>.`),
      },
      LIKE: {
        title: "LIKE — pattern match",
        body: p(`String pattern search. <code>%</code> = any sequence, <code>_</code> = one character.`),
      },
      LIMIT: {
        title: "LIMIT",
        body: p(`Caps how many rows are returned.`),
      },
      DISTINCT: {
        title: "DISTINCT",
        body: p(`Removes duplicate values from the result.`),
      },
      COUNT: {
        title: "COUNT",
        body: p(`Aggregate: how many rows (or non-NULL values).`),
      },
      SUM: {
        title: "SUM",
        body: p(`Aggregate: adds numbers in a group.`),
      },
      AVG: {
        title: "AVG",
        body: p(`Aggregate: average of numbers.`),
      },
      MIN: {
        title: "MIN",
        body: p(`Aggregate: smallest value.`),
      },
      MAX: {
        title: "MAX",
        body: p(`Aggregate: largest value.`),
      },
      WITH: {
        title: "WITH — CTE",
        body: p(`Names a temporary result (Common Table Expression) for clearer queries.`),
      },
      CASE: {
        title: "CASE",
        body: p(`If/else logic inside a query — pick labels from conditions.`),
      },
      WHEN: {
        title: "WHEN",
        body: p(`A condition branch inside <span class="tip-kw">CASE</span>.`),
      },
      THEN: {
        title: "THEN",
        body: p(`Result used when a <span class="tip-kw">WHEN</span> condition matches.`),
      },
      END: {
        title: "END",
        body: p(`Closes a <span class="tip-kw">CASE</span> expression.`),
      },
      EXISTS: {
        title: "EXISTS",
        body: p(`True if a subquery finds at least one row.`),
      },
      UNION: {
        title: "UNION",
        body: p(`Stacks two result sets (unique rows unless <span class="tip-kw">ALL</span>).`),
      },
      PRIMARY: {
        title: "PRIMARY KEY",
        body: p(`Unique row identity for the table.`),
      },
      KEY: {
        title: "KEY",
        body: p(`Part of constraint phrases like PRIMARY KEY / FOREIGN KEY.`),
      },
      FOREIGN: {
        title: "FOREIGN KEY",
        body: p(`Ensures a value points at a real row in another table.`),
      },
      REFERENCES: {
        title: "REFERENCES",
        body: p(`Names the parent table/column a foreign key points to.`),
      },
      INDEX: {
        title: "INDEX",
        body: p(`Lookup helper that can speed WHERE / JOIN filters.`),
      },
      VIEW: {
        title: "VIEW",
        body: p(`A saved query you can SELECT from like a virtual table.`),
      },
      BEGIN: {
        title: "BEGIN",
        body: p(`Starts a transaction — changes commit together.`),
      },
      COMMIT: {
        title: "COMMIT",
        body: p(`Permanently saves the current transaction.`),
      },
      PRAGMA: {
        title: "PRAGMA",
        body: p(`SQLite setting switch (e.g. turn foreign keys on).`),
      },
    },
  };

  // Aliases / token forms
  LEX.cpp["#include"] = LEX.cpp.include;
  LEX.html["!DOCTYPE"] = LEX.html.DOCTYPE;
  LEX.sql.ASC = {
    title: "ASC",
    body: p(`Ascending sort — smallest / earliest first.`),
  };
  LEX.sql.DESC = {
    title: "DESC",
    body: p(`Descending sort — largest / latest first.`),
  };

  /** @type {{ title: string, description: string, id: string }} */
  let projectCtx = { title: "", description: "", id: "" };

  function setProject(info) {
    projectCtx = {
      title: String(info?.title || "").trim(),
      description: String(info?.description || "").trim(),
      id: String(info?.id || "").trim(),
    };
  }

  /** Well-known APIs / types — “what it is” explanations */
  const API = {
    DataFrame: {
      title: "DataFrame — table of data",
      what: "A pandas 2D table (rows × named columns). Think spreadsheet or SQL result set you can filter, join, and plot.",
    },
    Series: {
      title: "Series — one column",
      what: "A pandas 1D labeled array — one column (or one row) of a DataFrame.",
    },
    pd: {
      title: "pd — pandas alias",
      what: "Short name for the pandas library after <code>import pandas as pd</code>.",
    },
    pandas: {
      title: "pandas — data tables in Python",
      what: "The go-to library for tabular data: load CSV, clean columns, compute stats, export results.",
    },
    np: {
      title: "np — NumPy alias",
      what: "Short name for NumPy after <code>import numpy as np</code>. Fast numeric arrays and math.",
    },
    numpy: {
      title: "NumPy — numeric arrays",
      what: "Python’s array/math library. Used for random numbers, vectors, and heavy calculations.",
    },
    Path: {
      title: "Path — file path object",
      what: "From pathlib: a path you can join, create folders with, and save files to — safer than raw strings.",
    },
    OUTPUT_DIR: {
      title: "OUTPUT_DIR — save folder",
      what: "Project folder where this lab writes its files (CSV, charts, text).",
    },
    plt: {
      title: "plt — Matplotlib pyplot",
      what: "Plotting interface: create figures, draw lines/bars, save PNGs for reports.",
    },
    matplotlib: {
      title: "Matplotlib — charts",
      what: "Library for drawing graphs (equity curves, histograms, bars).",
    },
    read_csv: {
      title: "read_csv — load a table",
      what: "pandas function that reads a CSV file into a DataFrame.",
    },
    to_csv: {
      title: "to_csv — save a table",
      what: "Writes a DataFrame (or Series) out as a CSV file for later steps or reports.",
    },
    pct_change: {
      title: "pct_change — percent change",
      what: "Shows how much each value went up or down from the row before, as a percentage.",
    },
    rolling: {
      title: "rolling — moving window",
      what: "Looks at a sliding window of recent rows (say the last 7) to average or smooth them.",
    },
    mean: { title: "mean — average", what: "Adds the values and divides by how many there are." },
    std: { title: "std — spread", what: "Measures how spread out the numbers are from the average." },
    sum: { title: "sum — total", what: "Adds all the values together." },
    head: { title: "head — first rows", what: "Shows the first few rows of a table so you can check it." },
    tail: { title: "tail — last rows", what: "Shows the last few rows of a table." },
    fillna: { title: "fillna — fill blanks", what: "Fills in empty (missing) cells so later steps don’t break." },
    ffill: { title: "ffill — copy down", what: "Fills a blank cell by copying the last value above it." },
    dropna: { title: "dropna — drop blanks", what: "Removes rows (or columns) that have empty values." },
    shift: { title: "shift — slide values", what: "Moves the values up or down by a few rows." },
    cumprod: { title: "cumprod — multiply as you go", what: "Multiplies the numbers together step by step." },
    cumsum: { title: "cumsum — add as you go", what: "Adds the numbers up step by step." },
    mkdir: { title: "mkdir — make folder", what: "Creates a folder so files can be saved into it." },
    exist: { title: "exists — is it there?", what: "True if the file or folder is already on disk." },
    default_rng: {
      title: "default_rng — random numbers",
      what: "Starts the random-number generator. Seed it to get the same results each run.",
    },
    normal: {
      title: "normal — random spread",
      what: "Picks random numbers that cluster around an average (a bell-shaped spread).",
    },
    date_range: {
      title: "date_range — list of dates",
      what: "Builds a row of dates in order, like a calendar.",
    },
    print: { title: "print — show output", what: "Writes text to the lab output so you can inspect results." },
    display: { title: "display — show rich output", what: "Renders images/figures in the notebook-style lab output." },
    console: { title: "console — browser logger", what: "JavaScript’s debug printer (<code>console.log</code>)." },
    log: { title: "log — print to console", what: "Writes a message to the browser console / lab output." },
    document: { title: "document — the page", what: "The live HTML document the browser is showing." },
    querySelector: {
      title: "querySelector — find one element",
      what: "Picks the first matching HTML element with a CSS selector.",
    },
    SELECT: { title: "SELECT — read rows", what: "Asks the database which columns/rows to return." },
    FROM: { title: "FROM — which table", what: "Names the table (or subquery) you’re reading from." },
    WHERE: { title: "WHERE — filter rows", what: "Keeps only rows that match a condition." },
    JOIN: { title: "JOIN — combine tables", what: "Links rows from two tables using a key (e.g. customer_id)." },
    GROUP: { title: "GROUP BY — aggregate", what: "Collapses rows into buckets (day, segment…) and computes totals." },
    COUNT: { title: "COUNT — how many", what: "Counts rows (or non-null values) in a group." },
    ROUND: { title: "ROUND — fix decimals", what: "Rounds a number for cleaner dashboard display." },
  };

  function kindFromType(type, raw, line) {
    const t = type || "";
    if (/string/.test(t) || /^['"`]/.test(raw)) return "string";
    if (/number|digit/.test(t) || /^\d/.test(raw)) return "number";
    if (/comment/.test(t)) return "comment";
    if (/keyword/.test(t) || /builtin/.test(t)) return "keyword";
    if (/operator/.test(t) || /^[=+\-*/%<>!&|]+$/.test(raw)) return "operator";
    if (/def/.test(t) && new RegExp(`\\b(def|function)\\s+${raw}\\b`).test(line)) return "function";
    if (new RegExp(`\\b${raw}\\s*\\(`).test(line)) return "call";
    if (new RegExp(`\\b(const|let|var)\\s+${raw}\\b`).test(line)) return "variable";
    if (new RegExp(`\\b${raw}\\s*=`).test(line) && !/==/.test(line)) return "variable";
    if (/property|attribute/.test(t)) return "property";
    if (/variable|def|tag/.test(t)) return "name";
    if (/^[A-Z][a-zA-Z0-9]+$/.test(raw)) return "type";
    return "name";
  }

  function kindLabel(kind) {
    return (
      {
        string: "String (text value)",
        number: "Number",
        comment: "Comment",
        keyword: "Language keyword",
        operator: "Operator",
        function: "Function definition",
        call: "Function / method call",
        variable: "Variable",
        property: "Property / field",
        type: "Type / class",
        name: "Name (identifier)",
      }[kind] || "Code symbol"
    );
  }

  /** How this token is being used on *this* line */
  function roleOnLine(raw, line, lang, kind) {
    const L = String(line || "");
    const name = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (kind === "string") {
      return `On this line it supplies the text <code>${escapeHtml(raw.slice(0, 48))}</code> used by the statement.`;
    }
    if (kind === "number") {
      return `On this line it is a concrete numeric input that drives the calculation or size of something.`;
    }
    if (kind === "comment") {
      return `This note explains intent to humans; it does not change how the program runs.`;
    }

    // Assignment target: df = ...
    if (new RegExp(`^\\s*${name}\\s*=(?!=)`).test(L) || new RegExp(`\\b(const|let|var)\\s+${name}\\s*=`).test(L)) {
      return `On this line you <strong>create/update</strong> <span class="tip-id">${escapeHtml(
        raw
      )}</span> — later steps will reuse this result.`;
    }

    // Method call: obj.method(
    const meth = L.match(new RegExp(`([\\w$]+)\\.${name}\\s*\\(`));
    if (meth) {
      return `Here it is a <strong>method</strong> called on <span class="tip-id">${escapeHtml(
        meth[1]
      )}</span> — it transforms or reads that object for this step.`;
    }

    // Attribute access: obj.attr (not call)
    const attr = L.match(new RegExp(`([\\w$]+)\\.${name}(?!\\s*\\()`));
    if (attr && attr[1] !== raw) {
      return `Here it is a <strong>field/property</strong> read from <span class="tip-id">${escapeHtml(
        attr[1]
      )}</span>.`;
    }

    // pd.DataFrame( / np.array(
    const ctor = L.match(new RegExp(`([\\w$]+)\\.${name}\\s*\\(`));
    if (ctor) {
      return `Here <span class="tip-id">${escapeHtml(ctor[1])}</span> builds a <span class="tip-id">${escapeHtml(
        raw
      )}</span> for this step’s data.`;
    }

    // Function call
    if (new RegExp(`\\b${name}\\s*\\(`).test(L)) {
      return `On this line it is <strong>called</strong> to do work — look at the arguments to see inputs for this project step.`;
    }

    // import
    if (/\bimport\b|\bfrom\b/.test(L) && L.includes(raw)) {
      return `This line is loading the library so the rest of the project can use its tools.`;
    }

    // SQL
    if ((lang === "sql" || /select|from|where|join/i.test(L)) && /^[A-Za-z_][\w]*$/.test(raw)) {
      if (/^\s*SELECT\b/i.test(L) && new RegExp(`\\b${name}\\b`, "i").test(L)) {
        return `In this query it is part of what you ask the database to return or filter.`;
      }
    }

    // Appears on RHS
    if (new RegExp(`=.*\\b${name}\\b`).test(L)) {
      return `On this line it is <strong>read</strong> as an input into the expression on the right-hand side.`;
    }

    return `On this line it participates in the statement’s work — read the full line to see how it connects to neighboring names.`;
  }

  function projectRoleHint(raw) {
    const title = projectCtx.title;
    const desc = projectCtx.description;
    if (!title && !desc) return "";
    const blob = `${title} ${desc}`.toLowerCase();
    const n = raw.toLowerCase();
    const who = `<strong>${escapeHtml(title || "This project")}</strong>${
      desc ? ` — <em>${escapeHtml(desc.length > 100 ? desc.slice(0, 97) + "…" : desc)}</em>` : ""
    }`;

    if (/dataframe|series|^pd$|pandas|read_csv|to_csv|^df$/i.test(n)) {
      if (/market|bar|price|quant|trading|return|signal|factor|stock/.test(blob)) {
        return `${who}. Here it holds (or builds) the market/price table the desk cleans and studies.`;
      }
      if (/analy|metric|dashboard|revenue|csv|data/.test(blob)) {
        return `${who}. Here it is the working dataset you turn into metrics or charts.`;
      }
      return `${who}. Here it is the main table of rows this step processes.`;
    }
    if (/path|output_dir|mkdir|to_csv|savefig/i.test(n)) {
      return `${who}. Here it saves artifacts for later steps or a report.`;
    }
    if (/rolling|pct_change|sharpe|signal|shift|cumprod|^ret$|^z$/i.test(n) || /return|signal|risk|sharpe|backtest/.test(blob)) {
      return `${who}. Here it feeds the research / risk math in this notebook.`;
    }
    if (/select|from|join|group|count|orders|customers/i.test(n) || /sql|revenue|segment|order/.test(blob)) {
      return `${who}. Here it is part of the analytics query you’d run for this role.`;
    }
    return `${who}. Tie this symbol back to the goal of the current step.`;
  }

  function stripP(html) {
    return String(html || "")
      .replace(/^<p>/i, "")
      .replace(/<\/p>$/i, "")
      .trim();
  }

  // Keep symbol tips to a single plain-English sentence. (Extra args are
  // accepted but ignored so existing call sites keep working.)
  function tipBody(whatHtml) {
    return p(whatHtml);
  }

  const NAME_HINTS = {
    df: {
      title: "df — your table",
      what: "A common short name for your table of data (a DataFrame).",
    },
    px: {
      title: "px — price series",
      what: "Usually a NumPy/array of prices used to build synthetic bars.",
    },
    ret: {
      title: "ret — returns",
      what: "Period-over-period return series (often from <code>pct_change</code>).",
    },
    sharpe: {
      title: "sharpe — risk-adjusted return",
      what: "A ratio of excess return to volatility — higher usually means better reward per unit risk.",
    },
    signal: {
      title: "signal — trade stance",
      what: "A series of 0/1 (or -1/0/1) positions your strategy would hold.",
    },
  };

  function lookupToken(lang, text, type, lineText) {
    if (!text) return null;
    const raw = text.trim();
    if (!raw) return null;
    const line = String(lineText || "");
    const bag = LEX[lang] || {};
    const common = LEX.common;
    const kind = kindFromType(type, raw, line);
    const role = roleOnLine(raw, line, lang, kind);
    const projectHtml = projectRoleHint(raw);

    const candidates = [raw, raw.toLowerCase(), raw.toUpperCase()];
    for (const c of candidates) {
      if (bag[c] || common[c]) {
        const base = bag[c] || common[c];
        return {
          title: base.title,
          body: tipBody(stripP(base.body), role, projectHtml),
        };
      }
    }

    // Strip HTML tag brackets / attributes
    const tag = raw.replace(/^<\/?/, "").replace(/>$/, "").split(/\s/)[0];
    if (tag && (bag[tag.toLowerCase()] || bag[tag])) {
      const base = bag[tag.toLowerCase()] || bag[tag];
      return {
        title: base.title,
        body: tipBody(stripP(base.body), role, projectHtml),
      };
    }

    const api =
      API[raw] ||
      API[raw.toLowerCase()] ||
      API[raw.toUpperCase()] ||
      NAME_HINTS[raw] ||
      NAME_HINTS[raw.toLowerCase()];
    if (api) {
      return {
        title: api.title,
        body: tipBody(api.what, role, projectHtml),
      };
    }

    if (type) {
      if (/string/.test(type) || /^['"`]/.test(raw)) {
        return {
          title: "String literal",
          body: tipBody(
            `Text data in quotes: <span class="tip-str">${escapeHtml(raw.slice(0, 48))}</span>.`,
            role,
            projectHtml
          ),
        };
      }
      if (/number|digit/.test(type)) {
        return {
          title: "Number",
          body: tipBody(
            `A numeric value: <span class="tip-num">${escapeHtml(raw)}</span>.`,
            role,
            projectHtml
          ),
        };
      }
      if (/comment/.test(type)) {
        return {
          title: "Comment",
          body: tipBody(`Notes for humans — ignored when the program runs.`, role, ""),
        };
      }
      if (/keyword/.test(type) || /builtin/.test(type)) {
        return {
          title: `${raw} — ${kindLabel("keyword")}`,
          body: tipBody(
            `A built-in language word with a fixed meaning (not a name you invented).`,
            role,
            projectHtml
          ),
        };
      }
      if (/operator/.test(type)) {
        return {
          title: `Operator ${raw}`,
          body: tipBody(`Combines, assigns, or compares values.`, role, projectHtml),
        };
      }
    }

    if (/^['"`]/.test(raw)) {
      return {
        title: "String literal",
        body: tipBody(`Quoted text value.`, role, projectHtml),
      };
    }
    if (/^\d+(\.\d+)?$/.test(raw)) {
      return {
        title: "Number",
        body: tipBody(
          `Numeric literal <span class="tip-num">${escapeHtml(raw)}</span>.`,
          role,
          projectHtml
        ),
      };
    }
    if (/^[A-Za-z_][\w$]*$/.test(raw)) {
      const what = `A name that stands for a value, so the rest of the code can reuse it.`;
      return {
        title: `${raw}`,
        body: tipBody(what, role, projectHtml),
      };
    }
    return null;
  }

  function projectLineWhy(doesMsg) {
    const title = projectCtx.title;
    const desc = projectCtx.description;
    if (!title && !desc) {
      return `This row advances the current step so later cells have the data/state they need.`;
    }
    const who = `<strong>${escapeHtml(title)}</strong>${
      desc ? ` — ${escapeHtml(desc.length > 120 ? desc.slice(0, 117) + "…" : desc)}` : ""
    }`;
    const blob = `${title} ${desc} ${doesMsg}`.toLowerCase();
    if (/market|bar|price|quant|tick|clean|outlier|return|signal|sharpe|factor|backtest/.test(blob)) {
      return `For ${who}: this row is a building block of the research / data-QC workflow (create data → clean → measure → save).`;
    }
    if (/sql|order|revenue|segment|analy|dashboard|metric/.test(blob)) {
      return `For ${who}: this row shapes the desk metric or table you need for decisions.`;
    }
    if (/form|landing|hero|html|email|page/.test(blob)) {
      return `For ${who}: this row is part of the page/markup you’re assembling for that deliverable.`;
    }
    return `For ${who}: this row exists to move that goal forward in this step.`;
  }

  /** Rich whole-line explanations for the end-of-line shiny dots */
  function explainLine(lang, lineText, lineNo, neighbors) {
    const rawLine = String(lineText || "");
    const t = rawLine.trim();
    const prev = String(neighbors?.prev || "").trim();
    const next = String(neighbors?.next || "").trim();
    const n = lineNo + 1;

    // One plain sentence about the line, then the line itself.
    const finish = (headline, doesHtml) => ({
      title: `Line ${n}: ${headline}`,
      body: tipHtml([
        p(doesHtml),
        p(`<code>${escapeHtml(t.length > 120 ? t.slice(0, 117) + "…" : t)}</code>`),
      ]),
    });

    if (!t) {
      return finish(
        "blank",
        `An empty line for readability — it separates ideas so the step is easier to scan.`,
        ""
      );
    }

    // Comments
    if (/^(#|\/\/|--|<!--)/.test(t) || /^\/\*/.test(t)) {
      const body = t.replace(/^#\s?/, "").replace(/^\/\/\s?/, "").replace(/^--\s?/, "");
      if (/tweak/i.test(t)) {
        return finish(
          "tweak hint",
          `A human note: values just below are meant to be edited — change them, re-run, and watch outputs change.`,
          ""
        );
      }
      if (/inject|bad tick|outlier|hack|todo|note/i.test(t)) {
        return finish(
          "intent note",
          `Comment explaining the next action: <em>${escapeHtml(body.slice(0, 100))}</em>. It documents why the following code exists.`,
          ""
        );
      }
      return finish(
        "comment",
        `A note for readers (“${escapeHtml(body.slice(0, 90))}”). The computer skips it; you use it to remember intent.`,
        ""
      );
    }

    // Ordered specific → general matchers: [re, headline, does]
    const rules = [
      [
        /\bdefault_rng\s*\(/,
        "set up random numbers",
        `Starts the random-number generator. Give it a seed and you get the same “random” results every run.`,
      ],
      [
        /\bnormal\s*\([^)]*\)/,
        "pick random numbers",
        `Picks random numbers that cluster around an average (a bell-shaped spread).`,
      ],
      [
        /\bcumsum\s*\(/,
        "add up as you go",
        `Adds the numbers up step by step, so each value includes everything before it.`,
      ],
      [
        /\bnp\.exp\s*\(/,
        "grow the numbers",
        `Raises the special number e to a power — a smooth way to scale values up.`,
      ],
      [
        /\bdate_range\s*\(/,
        "make a list of dates",
        `Builds a row of dates in order, like a calendar, to label your data.`,
      ],
      [
        /\bDataFrame\s*\(/,
        "make a table",
        `Puts your data into a table with named columns, like a spreadsheet.`,
      ],
      [
        /\bread_csv\s*\(/,
        "open a CSV file",
        `Loads a CSV file into a table you can work with.`,
      ],
      [
        /\bto_csv\s*\(/,
        "save to a CSV file",
        `Saves your table to a CSV file so you can open it later or in a spreadsheet.`,
      ],
      [
        /\bpct_change\s*\(/,
        "percent change",
        `Works out how much each value went up or down from the row before, as a percentage.`,
      ],
      [
        /\brolling\s*\(/,
        "moving window",
        `Looks at a sliding window of recent rows (say the last 7) so you can average or smooth them.`,
      ],
      [
        /\b(ffill|fillna|dropna)\s*\(/,
        "handle empty cells",
        `Fills in or removes empty (missing) values so the next steps don’t break.`,
      ],
      [
        /\bshift\s*\(/,
        "slide the values",
        `Moves the values up or down by a few rows so you can line them up.`,
      ],
      [
        /\bcumprod\s*\(/,
        "multiply as you go",
        `Multiplies the numbers together step by step, so growth builds up over time.`,
      ],
      [
        /\bmkdir\s*\(/,
        "make a folder",
        `Creates the folder where your files will be saved.`,
      ],
      [
        /\bPath\s*\(/,
        "point to a file",
        `Describes where a file or folder lives on your computer.`,
      ],
      [
        /\[\s*\d+\s*\]\s*\*=/,
        "change one item",
        `Multiplies just one item in the list — often to change a single value on purpose.`,
      ],
      [
        /\[\s*\d+\s*\]\s*=/,
        "set one item",
        `Changes just one item in the list at that position.`,
      ],
      [
        /^\s*from\s+\S+\s+import\b/,
        "import selected tools",
        `Brings specific names from a module into this cell so you can call them without the full package prefix.`,
      ],
      [
        /^\s*import\b/,
        "load a library",
        `Loads a module (pandas, numpy, …) that the rest of the step depends on.`,
      ],
      [
        /^\s*#include\b/,
        "include a C++ header",
        `Pulls in a header so this file can use standard library / API types and functions.`,
      ],
      [
        /^\s*using\s+namespace\b/,
        "shorten C++ names",
        `Lets you write shorter names (e.g. <code>cout</code>) without repeating <code>std::</code>.`,
      ],
      [
        /^\s*def\s+(\w+)/,
        "define a function",
        `Creates a reusable function — a named recipe the rest of the project can call.`,
      ],
      [
        /^\s*class\b/,
        "define a class",
        `Starts a type/blueprint that bundles data and methods.`,
      ],
      [
        /^\s*if\b/,
        "branch when true",
        `Decision point: the following block runs only when the condition is true.`,
      ],
      [
        /^\s*elif\b|^\s*else\s+if\b/,
        "alternate branch",
        `Another condition checked only if earlier branches failed.`,
      ],
      [
        /^\s*else\b/,
        "fallback branch",
        `Runs when no earlier condition was true.`,
      ],
      [
        /^\s*for\b/,
        "loop over items",
        `Repeats work for each item (or index) — batch processing in this step.`,
      ],
      [
        /^\s*while\b/,
        "loop while true",
        `Keeps repeating until the condition becomes false.`,
      ],
      [
        /^\s*return\b/,
        "return a result",
        `Leaves the function and hands a value back to the caller.`,
      ],
      [
        /^\s*print\s*\(|^\s*console\.log\s*\(|\bcout\s*<</,
        "show a value",
        `Shows a value in the output so you can see what happened.`,
      ],
      [
        /^\s*display\s*\(/,
        "show a picture or table",
        `Displays an image, chart, or table in the output area.`,
      ],
      [
        /\.savefig\s*\(|\.plot\s*\(/,
        "draw a chart",
        `Turns your numbers into a chart (and can save it as an image).`,
      ],
      [
        /^\s*SELECT\b/i,
        "get data",
        `Asks the database for the columns and rows you want.`,
      ],
      [
        /^\s*CREATE\s+TABLE\b/i,
        "make a table",
        `Creates a new table and lists the columns it will have.`,
      ],
      [
        /^\s*INSERT\b/i,
        "add rows",
        `Adds new rows of data into a table.`,
      ],
      [
        /^\s*UPDATE\b/i,
        "change rows",
        `Changes data in rows that already exist — use WHERE to pick which ones.`,
      ],
      [
        /^\s*DELETE\b/i,
        "remove rows",
        `Removes the rows that match your condition.`,
      ],
      [
        /^\s*DROP\b/i,
        "delete a table",
        `Deletes a whole table (or view/index) along with its data.`,
      ],
      [
        /^\s*WITH\b/i,
        "name a temporary result",
        `Gives a temporary result a name so the main query is easier to read.`,
      ],
      [
        /^\s*GROUP\s+BY\b/i,
        "group rows",
        `Groups rows together so you can total or count each group.`,
      ],
      [
        /^\s*JOIN\b|\bJOIN\b/i,
        "combine tables",
        `Combines rows from two tables that share a matching value.`,
      ],
      [
        /^\s*<!DOCTYPE/i,
        "HTML5 document type",
        `Tells the browser this is a modern HTML document.`,
      ],
      [
        /^\s*<(header|main|nav|section|article|footer)\b/i,
        "page landmark",
        `Adds a semantic region of the page so structure stays clear for users and accessibility.`,
      ],
      [
        /^\s*<h[1-6]\b/i,
        "heading",
        `Places a title/heading that organizes content hierarchy on the page.`,
      ],
      [
        /^\s*int\s+main\s*\(/,
        "program entry",
        `C++ entry point — execution of this program starts here.`,
      ],
      [
        /^\s*(const|let|var)\s+(\w+)/,
        "declare a binding",
        `Creates a JavaScript name for a value used by the rest of this step.`,
      ],
      [
        /^\s*function\b|=>/,
        "define JS function",
        `Defines reusable behavior for this interactive step.`,
      ],
    ];

    for (const [re, headline, does] of rules) {
      if (re.test(t)) {
        let extra = "";
        if (/DataFrame/.test(t) && /ts|close|date/i.test(t + next)) {
          extra = p(
            `Nearby columns (e.g. timestamps / close) become the fields you’ll QC and analyze next.`
          );
        }
        if (/\[\s*\d+\s*\]\s*\*=/.test(t) && /bad tick|outlier|inject/i.test(prev)) {
          extra = p(`The previous comment flags this as an intentional bad tick for the cleanup logic.`);
        }
        return finish(headline, does, extra);
      }
    }

    // Generic assignment: name = expression
    const assign = t.match(/^\s*([A-Za-z_][\w]*)\s*=(?!=)\s*(.+)$/);
    if (assign) {
      const [, left, right] = assign;
      let does = `Works something out and saves it as <span class="tip-id">${escapeHtml(
        left
      )}</span> so later lines can use it.`;
      if (/^\d+(\.\d+)?$/.test(right.trim())) {
        does = `Sets <span class="tip-id">${escapeHtml(left)}</span> to <span class="tip-num">${escapeHtml(
          right.trim()
        )}</span> — a setting you can change and re-run.`;
      } else if (/rng|random/i.test(right)) {
        does = `Sets up random numbers and stores them in <span class="tip-id">${escapeHtml(
          left
        )}</span>.`;
      } else if (/Path\(|OUTPUT|outputs/i.test(right) || /DIR|path|out/i.test(left)) {
        does = `Remembers where files will be saved or read, as <span class="tip-id">${escapeHtml(
          left
        )}</span>.`;
      } else if (/DataFrame|read_csv|date_range/i.test(right)) {
        does = `Loads or builds a table of data and stores it in <span class="tip-id">${escapeHtml(
          left
        )}</span>.`;
      } else if (/exp\(|cumsum|normal\(/i.test(right)) {
        does = `Creates a list of numbers and stores it in <span class="tip-id">${escapeHtml(
          left
        )}</span>.`;
      }
      return finish(`set “${left}”`, does);
    }

    // Dangling dict / closing punctuation rows inside a multi-line call
    if (/^\s*[)}\]],?\s*$/.test(t) || /^\s*['"][\w]+['"]\s*:/.test(t)) {
      return finish(
        "part of the line above",
        `Continues something that was split over a few rows — it adds a value or closes the group.`
      );
    }

    // Fallback
    return finish(
      "run this line",
      `Runs this whole line as one step in the project.`
    );
  }

  let tipEl = null;
  let tipAnchor = null;
  let tipMode = null; // 'token' | 'line'
  let activeMark = null;
  let openEditors = new WeakMap();

  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement("div");
    tipEl.className = "lab-explain-tip";
    tipEl.hidden = true;
    tipEl.setAttribute("role", "dialog");
    tipEl.setAttribute("aria-live", "polite");
    tipEl.innerHTML = `
      <div class="lab-explain-tip-head">
        <div class="lab-explain-tip-title"></div>
        <button type="button" class="lab-explain-close" aria-label="Close explanation">×</button>
      </div>
      <div class="lab-explain-badge"></div>
      <div class="lab-explain-tip-body"></div>
      <div class="lab-explain-tip-foot"></div>
    `;
    document.body.appendChild(tipEl);
    tipEl.querySelector(".lab-explain-close").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideTip();
    });
    tipEl.addEventListener("click", (e) => e.stopPropagation());
    return tipEl;
  }

  function hideTip() {
    const el = ensureTip();
    el.hidden = true;
    tipAnchor = null;
    tipMode = null;
    if (activeMark) {
      try {
        activeMark.clear();
      } catch (_) {
        /* ignore */
      }
      activeMark = null;
    }
    document.querySelectorAll(".lab-explain-dot.is-active").forEach((d) => d.classList.remove("is-active"));
  }

  function placeTipNear(rect) {
    const el = ensureTip();
    el.hidden = false;
    const pad = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = el.offsetWidth || 320;
    const th = el.offsetHeight || 160;
    let left = (rect?.left || 16) + (rect?.width || 0) / 2 - tw / 2;
    let top = (rect?.bottom || 40) + 8;
    if (top + th > vh - pad) top = Math.max(pad, (rect?.top || 40) - th - 8);
    left = Math.max(pad, Math.min(left, vw - tw - pad));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  function showTip({ title, body, badge, foot, anchorRect, mode }) {
    const el = ensureTip();
    el.querySelector(".lab-explain-tip-title").textContent = title || "Explanation";
    el.querySelector(".lab-explain-badge").textContent = badge || "";
    el.querySelector(".lab-explain-badge").style.display = badge ? "inline-block" : "none";
    el.querySelector(".lab-explain-tip-body").innerHTML = body || "";
    el.querySelector(".lab-explain-tip-foot").textContent =
      foot ||
      (mode === "line"
        ? isTouchUi()
          ? "Shiny dots = whole-row meaning in this project · tap × to close"
          : "Shiny dots explain the whole row in this project · click × to close"
        : isTouchUi()
          ? "Tap a word for symbols · shiny dots for the whole row · tap × to close"
          : "Hover a word for symbols · shiny dots for the whole row · click × to close");
    tipMode = mode || null;
    placeTipNear(anchorRect);
  }

  function clearLineDots(cm) {
    const meta = openEditors.get(cm);
    if (!meta) return;
    (meta.bookmarks || []).forEach((bm) => {
      try {
        bm.clear();
      } catch (_) {
        /* ignore */
      }
    });
    meta.bookmarks = [];
  }

  function refreshLineDots(cm, lang) {
    const meta = openEditors.get(cm);
    if (!meta) return;
    clearLineDots(cm);
    const lineCount = cm.lineCount();
    for (let i = 0; i < lineCount; i++) {
      const text = cm.getLine(i) || "";
      if (!text.trim()) continue;
      const dot = document.createElement("span");
      dot.className = "lab-explain-dot";
      dot.title = isTouchUi() ? "Tap for line explanation" : "Hover for line explanation";
      dot.setAttribute("role", "button");
      dot.setAttribute("aria-label", `Explain line ${i + 1}`);
      const lineIndex = i;

      const showLine = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        document.querySelectorAll(".lab-explain-dot.is-active").forEach((d) => d.classList.remove("is-active"));
        dot.classList.add("is-active");
        if (activeMark) {
          try {
            activeMark.clear();
          } catch (_) {
            /* ignore */
          }
          activeMark = null;
        }
        const info = explainLine(lang, cm.getLine(lineIndex), lineIndex, {
          prev: lineIndex > 0 ? cm.getLine(lineIndex - 1) : "",
          next: lineIndex < cm.lineCount() - 1 ? cm.getLine(lineIndex + 1) : "",
        });
        const rect = dot.getBoundingClientRect();
        tipAnchor = `line:${lineIndex}`;
        showTip({
          title: info.title,
          body: info.body,
          badge: "Whole line",
          mode: "line",
          anchorRect: rect,
        });
      };

      if (isTouchUi()) {
        dot.addEventListener("click", showLine);
      } else {
        dot.addEventListener("mouseenter", showLine);
        dot.addEventListener("focus", showLine);
        // keep open while moving into tooltip
        dot.addEventListener("mouseleave", () => {
          // delay so user can move into tip
          setTimeout(() => {
            if (tipMode === "line" && tipAnchor === `line:${lineIndex}` && !ensureTip().matches(":hover") && !dot.matches(":hover")) {
              /* keep until X — user asked for close button; don't auto-dismiss aggressively on desktop for line */
            }
          }, 200);
        });
        dot.addEventListener("click", showLine);
      }

      const bm = cm.setBookmark(
        { line: i, ch: text.length },
        { widget: dot, insertLeft: false }
      );
      meta.bookmarks.push(bm);
    }
  }

  function tokenKey(token, pos) {
    return `${pos.line}:${token.start}:${token.end}:${token.string}`;
  }

  function attach(cm, lang) {
    if (!cm || !global.CodeMirror) return;
    const language = (lang || "javascript").toLowerCase();
    const meta = {
      lang: language,
      bookmarks: [],
      changeTimer: null,
      onChange: null,
      onMouse: null,
      onClick: null,
    };
    openEditors.set(cm, meta);

    const revealToken = (pos, clientRect) => {
      const token = cm.getTokenAt(pos);
      if (!token || !token.string || !token.string.trim()) {
        return;
      }
      // skip pure whitespace tokens
      if (/^\s+$/.test(token.string)) return;

      const lineText = cm.getLine(pos.line) || "";
      const info = lookupToken(language, token.string, token.type || "", lineText);
      if (!info) return;

      if (activeMark) {
        try {
          activeMark.clear();
        } catch (_) {
          /* ignore */
        }
      }
      activeMark = cm.markText(
        { line: pos.line, ch: token.start },
        { line: pos.line, ch: token.end },
        { className: "lab-explain-token-hit" }
      );

      tipAnchor = tokenKey(token, pos);
      let rect = clientRect;
      try {
        const coords = cm.charCoords({ line: pos.line, ch: token.start }, "window");
        const coordsEnd = cm.charCoords({ line: pos.line, ch: token.end }, "window");
        rect = {
          left: coords.left,
          top: coords.top,
          right: coordsEnd.right,
          bottom: coordsEnd.bottom,
          width: Math.max(8, coordsEnd.right - coords.left),
          height: Math.max(8, coordsEnd.bottom - coords.top),
        };
      } catch (_) {
        /* keep provided rect */
      }

      showTip({
        title: info.title,
        body: info.body,
        badge: language.toUpperCase(),
        mode: "token",
        anchorRect: rect,
      });
    };

    meta.onMouse = (e) => {
      if (isTouchUi()) return;
      if (e.target?.closest?.(".lab-explain-dot")) return;
      const pos = cm.coordsChar({ left: e.clientX, top: e.clientY }, "window");
      if (pos.outside) return;
      const token = cm.getTokenAt(pos);
      if (!token || !String(token.string || "").trim()) return;
      const key = tokenKey(token, pos);
      if (tipAnchor === key && tipMode === "token" && !ensureTip().hidden) return;
      revealToken(pos, {
        left: e.clientX - 4,
        top: e.clientY - 8,
        right: e.clientX + 4,
        bottom: e.clientY + 8,
        width: 8,
        height: 16,
      });
    };

    meta.onClick = (e) => {
      if (e.target?.closest?.(".lab-explain-dot")) return;
      if (e.target?.closest?.(".lab-explain-tip")) return;
      if (!isTouchUi() && e.detail === 0) return;
      // On desktop, click also pins a tip (in addition to hover)
      const pos = cm.coordsChar({ left: e.clientX, top: e.clientY }, "window");
      if (pos.outside) return;
      revealToken(pos, {
        left: e.clientX - 4,
        top: e.clientY - 8,
        right: e.clientX + 4,
        bottom: e.clientY + 8,
        width: 8,
        height: 16,
      });
    };

    const wrap = cm.getWrapperElement();
    wrap.addEventListener("mousemove", meta.onMouse);
    wrap.addEventListener("click", meta.onClick);

    meta.onChange = () => {
      clearTimeout(meta.changeTimer);
      meta.changeTimer = setTimeout(() => refreshLineDots(cm, language), 180);
    };
    cm.on("change", meta.onChange);

    refreshLineDots(cm, language);
  }

  function detach(cm) {
    const meta = openEditors.get(cm);
    if (!meta) return;
    clearLineDots(cm);
    try {
      cm.off("change", meta.onChange);
    } catch (_) {
      /* ignore */
    }
    const wrap = cm.getWrapperElement?.();
    if (wrap) {
      wrap.removeEventListener("mousemove", meta.onMouse);
      wrap.removeEventListener("click", meta.onClick);
    }
    openEditors.delete(cm);
  }

  // Global close helpers
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideTip();
  });

  global.LabExplain = {
    attach,
    detach,
    hide: hideTip,
    setProject,
    refresh(cm) {
      const meta = openEditors.get(cm);
      if (meta) refreshLineDots(cm, meta.lang);
    },
  };
})(window);
