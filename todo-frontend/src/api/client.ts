import axios from "axios";

// CRA exposes env vars prefixed with REACT_APP_
const base =
  process.env.REACT_APP_API_BASE ?? "http://localhost:8182/api";

export const api = axios.create({ baseURL: base });

